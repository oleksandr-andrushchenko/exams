import 'reflect-metadata'
import { ConnectionManager, useContainer as typeormUseContainer } from 'typeorm'
import { Container } from 'typedi'
import config from './configuration'
import express, { Application } from 'express'
import LoggerInterface from './services/logger/LoggerInterface'
import JwtTokenStrategyFactory from './services/token/strategy/JwtTokenStrategyFactory'
import TokenStrategyInterface from './services/token/strategy/TokenStrategyInterface'
import { MongoConnectionOptions } from 'typeorm/driver/mongodb/MongoConnectionOptions'
import { MongoDriver } from 'typeorm/driver/mongodb/MongoDriver'
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
const mongoLogging = config.db.type === 'mongodb' && config.db.logging

const connectionManager = new ConnectionManager()
Container.set(ConnectionManager, connectionManager)

const tokenStrategy: TokenStrategyInterface = Container.get<JwtTokenStrategyFactory>(JwtTokenStrategyFactory).create(config.jwt)
Container.set('tokenStrategy', tokenStrategy)

const dataSourceOptions: MongoConnectionOptions = {
  type: config.db.type,
  url: config.db.url,
  synchronize: config.db.synchronize,
  logging: config.db.logging,
  entities,
  subscribers,
  monitorCommands: mongoLogging,
}

const db = connectionManager.create(dataSourceOptions)
const authChecker = Container.get<AuthCheckerService>(AuthCheckerService)

const buildApolloServer = async (server: Server = undefined): Promise<ApolloServer> => {
  const schema = await buildSchema({
    // @ts-ignore
    resolvers,
    scalarsMap: scalars,
    container: Container,
    authChecker: authChecker.getTypeGraphqlAuthChecker(),
    emitSchemaFile: `${ projectDir }/schema.graphql`,
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
        for (const key of [ error.originalError.constructor.name, formattedError.extensions.code as string ]) {
          if (key && errors[name].types.includes(key)) {
            return { ...formattedError, extensions: { name, code: errors[name].code } }
          }
        }
      }

      return formattedError
    },
  })
}
const prepareExpress = async (app: Application, apolloServer: ApolloServer): Promise<Application> => {
  app.use(morgan(loggerFormat, { stream: { write: logger.info.bind(logger) } }))
  app.use(cors({ origin: config.client_url }))
  app.use(express.json())
  app.use(compression())
  app.use(expressMiddleware(apolloServer, {
    context: async ({ req }) => {
      return {
        user: await authChecker.getApolloContextUser(req),
      }
    },
  }))

  return app
}
const initializeDb = async (db: DataSource): Promise<void> => {
  await db.initialize()

  if (mongoLogging) {
    const conn = (db.driver as MongoDriver).queryRunner.databaseConnection
    conn.on('commandStarted', (event) => logger.debug('commandStarted', event))
    conn.on('commandSucceeded', (event) => logger.debug('commandSucceeded', event))
    conn.on('commandFailed', (event) => logger.error('commandFailed', event))
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
  server.listen({ port }, () => logger.info(`Server is running on port ${ port }`))

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