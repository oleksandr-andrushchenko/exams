import { randomUUID } from 'node:crypto'
import path from 'node:path'
import multer from 'multer'
import 'reflect-metadata'
import { ConnectionManager, useContainer as typeormUseContainer } from 'typeorm'
import { Container } from 'typedi'
import config from './configuration'
import express, { Application } from 'express'
import LoggerInterface from './services/logger/LoggerInterface'
import JwtTokenStrategyFactory from './services/token/strategy/JwtTokenStrategyFactory'
import TokenStrategyInterface from './services/token/strategy/TokenStrategyInterface'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'
import NullLogger from './services/logger/NullLogger'
import ClassValidatorValidator from './services/validator/ClassValidatorValidator'
import WinstonLogger from './services/logger/WinstonLogger'
import { createServer, Server } from 'http'
import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { expressMiddleware } from '@apollo/server/express4'
import { buildSchema } from 'type-graphql'
import { resolvers } from './resolvers'
import { scalars } from './scalars'
import { errors } from './errors'
import { subscribers } from './subscribers'
import Context from './context/Context'
import { entities } from './entities'
import { AuthCheckerService } from './services/auth/AuthCheckerService'
import { GraphQLError } from 'graphql/error'
import type { GraphQLFormattedError } from 'graphql/index'
import cors from 'cors'
import compression from 'compression'
import morgan from 'morgan'
import { DataSource } from 'typeorm/data-source/DataSource'
import { Client } from 'pg'
import slugify from './services/normalizers/SlugNormalizer'
import UserProvider from './services/user/UserProvider'
import TokenService from './services/token/TokenService'

const serverlessExpress = require('@vendia/serverless-express')

typeormUseContainer(Container)

Container.set('env', config.env)
const loggerFormat = config.logger.format
Container.set('loggerFormat', loggerFormat)
Container.set('loggerLevel', config.logger.level)
Container.set('authPermissions', config.auth.permissions)
Container.set('validatorOptions', config.validator)

const logger: LoggerInterface = config.logger.enabled ? Container.get<WinstonLogger>(WinstonLogger) : new NullLogger()
Container.set('logger', logger)

Container.set('validator', Container.get<ClassValidatorValidator>(ClassValidatorValidator))

const projectDir = config.projectDir

const connectionManager = new ConnectionManager()
Container.set(ConnectionManager, connectionManager)

const tokenStrategy: TokenStrategyInterface = Container.get<JwtTokenStrategyFactory>(JwtTokenStrategyFactory).create(
  config.jwt
)
Container.set('tokenStrategy', tokenStrategy)

const dataSourceOptions: PostgresConnectionOptions = {
  type: config.db.type,
  url: config.db.url,
  synchronize: config.db.synchronize,
  logging: config.db.logging,
  entities,
  subscribers,
  schema: config.db.schema,
  dropSchema: config.db.dropSchema
}

export const db = connectionManager.create(dataSourceOptions)
export const authChecker = Container.get<AuthCheckerService>(AuthCheckerService)

export const buildApolloServer = async (server: Server = undefined): Promise<ApolloServer> => {
  const schema = await buildSchema({
    // @ts-ignore
    resolvers,
    scalarsMap: scalars,
    container: Container,
    authChecker: authChecker.getTypeGraphqlAuthChecker(),
    emitSchemaFile: `${projectDir}/schema.graphql`
  })
  const plugins = []

  if (server) {
    plugins.push(ApolloServerPluginDrainHttpServer({ httpServer: server }))
  }

  return new ApolloServer<Context>({
    schema,
    plugins,
    formatError: (formattedError: GraphQLFormattedError, error: GraphQLError) => {
      for (const name in errors) {
        for (const key of [error.originalError?.constructor?.name, formattedError.extensions.code as string]) {
          if (key && errors[name].types.includes(key)) {
            return { ...formattedError, extensions: { name, code: errors[name].code } }
          }
        }
      }

      return formattedError
    }
  })
}
const imageExtensions: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp'
}
const userProvider = Container.get<UserProvider>(UserProvider)
const tokenService = Container.get<TokenService>(TokenService)

const uploadImage = multer({
  storage: multer.diskStorage({
    destination: path.resolve(process.cwd(), 'static'),
    filename: (_request, file, callback) => callback(null, randomUUID() + imageExtensions[file.mimetype])
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) =>
    callback(null, Object.prototype.hasOwnProperty.call(imageExtensions, file.mimetype))
}).single('image')
const prepareExpress = async (app: Application, apolloServer: ApolloServer): Promise<Application> => {
  app.use(morgan(loggerFormat, { stream: { write: logger.info.bind(logger) } }))
  app.use(cors({ origin: config.client_url, credentials: true }))
  app.use(express.json({ limit: '10mb' }))
  app.post('/login', async (request, response) => {
    const target =
      typeof request.body.redirect === 'string' &&
      request.body.redirect.startsWith('/') &&
      !request.body.redirect.startsWith('//')
        ? request.body.redirect
        : '/'
    try {
      const user = await userProvider.getUserByCredentials({
        email: request.body.email,
        password: request.body.password
      })
      const { token } = await tokenService.generateAccessToken(user, 100 * 24 * 60 * 60 * 1000)
      response.cookie('authenticationToken', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      })
      response.json({ redirect: target })
    } catch (error) {
      response.status(401).json({
        error: { status: 401, message: error instanceof Error ? error.message : 'Authentication failed' }
      })
    }
  })

  app.post('/logout', (_request, response) => {
    response.clearCookie('authenticationToken')
    response.json({ redirect: config.client_url })
  })

  app.post('/upload', async (request, response, next) => {
    const user = await authChecker.getApolloContextUser(request)
    if (!user) {
      response.status(401).json({ error: { status: 401, message: 'Authentication required' } })
      return
    }
    uploadImage(request, response, (error) => {
      if (error) {
        next(error)
        return
      }
      if (!request.file) {
        response.status(400).json({ error: { status: 400, message: 'A valid image is required' } })
        return
      }
      response.json({ filename: request.file.filename })
    })
  })
  app.use(compression())
  app.use(
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        return {
          user: await authChecker.getApolloContextUser(req)
        }
      }
    })
  )

  return app
}
export const initializeDb = async (db: DataSource): Promise<void> => {
  const schema = config.db.schema.replace(/\"/g, '\"\"')
  const client = new Client({ connectionString: config.db.url })
  await client.connect()
  await client.query('CREATE SCHEMA IF NOT EXISTS \"' + schema + '\"')
  await client.end()
  await db.initialize()

  const tables: Array<[string, string]> = [
    ['users', 'name'],
    ['exams', 'name'],
    ['questions', 'title']
  ]
  for (const [table, source] of tables) {
    const rows = await db.query(`SELECT "id", "${source}" FROM "${table}" WHERE "slug" IS NULL`)
    for (const row of rows) {
      const base = slugify(row[source], row.id)
      try {
        await db.query(`UPDATE "${table}" SET "slug" = $1 WHERE "id" = $2`, [base, row.id])
      } catch (error: any) {
        if (error?.code !== '23505') throw error
        await db.query(`UPDATE "${table}" SET "slug" = $1 WHERE "id" = $2`, [`${base}-${row.id}`, row.id])
      }
    }
  }
}

export const serverUp = async (): Promise<void> => {
  const app = express()
  const server = createServer(app)

  await initializeDb(db)

  const apolloServer = await buildApolloServer(server)
  await apolloServer.start()

  await prepareExpress(app, apolloServer)

  const port = config.app.port
  server.listen({ port }, () => logger.info(`Server is running on port ${port}`))

  const failureHandler = (error: string) => {
    logger.error(error)
    serverDown(server, () => process.exit(1))
  }

  process.on('uncaughtException', failureHandler)
  process.on('unhandledRejection', failureHandler)

  const successHandler = () => {
    logger.info('SIGTERM received')
    serverDown(server, () => process.exit(0))
  }

  process.on('SIGTERM', successHandler)
}
export const serverDown = async (server: Server, callback: () => {}): Promise<void> => {
  server.close(() => {
    logger.info('Server closed')
    db.destroy().then(() => {
      logger.info('Database connection closed')
      callback && callback()
    })
  })
}

export const testServerUp = async (): Promise<Application> => {
  const app = express()

  await initializeDb(db)

  const apolloServer = await buildApolloServer()
  await apolloServer.start()

  await prepareExpress(app, apolloServer)

  return app
}
export const testServerDown = async (): Promise<void> => {
  db.destroy().then(() => logger.info('Database connection closed'))
}

export const serverless = async (): Promise<Function> => {
  const app = express()

  await initializeDb(db)

  const apolloServer = await buildApolloServer()
  apolloServer.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests()

  await prepareExpress(app, apolloServer)

  // todo: add process signals processing/handlers

  return serverlessExpress({ app })
}
