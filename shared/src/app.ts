import 'reflect-metadata'
import express, { type Express, type Request, type Response } from 'express'
import nunjucks from 'nunjucks'
import serverlessExpress from '@vendia/serverless-express'
import { ConnectionManager, useContainer as typeormUseContainer } from 'typeorm'
import { type PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'
import { Container } from 'typedi'
import config from './config'
import { createPostgresConnection, initializePostgres } from './database/PostgresConnection'
import { entities } from './entities'
import { subscribers } from './subscribers'
import ClassValidatorValidator from './services/validator/ClassValidatorValidator'
import JwtTokenStrategyFactory from './services/token/strategy/JwtTokenStrategyFactory'
import LoggerInterface from './services/logger/LoggerInterface'
import NullLogger from './services/logger/NullLogger'
import WinstonLogger from './services/logger/WinstonLogger'
import { examUrl, questionUrl, staticUrl, url, userUrl } from './routes'
import { getErrorStatus } from "./errors";
import path from "node:path";

export interface ApplicationContext {
  app: Express
  db: ReturnType<typeof createPostgresConnection>['dataSource']
  logger: LoggerInterface
}

export const createApp = (dirname: string, configure: (context: ApplicationContext) => void): ApplicationContext => {
  typeormUseContainer(Container)
  Container.set('env', config.env)
  Container.set('loggerFormat', config.logger.format)
  Container.set('loggerLevel', config.logger.level)
  Container.set('authPermissions', config.auth.permissions)
  Container.set('validatorOptions', config.validator)

  const logger: LoggerInterface = config.logger.enabled ? Container.get<WinstonLogger>(WinstonLogger) : new NullLogger()
  Container.set('logger', logger)
  Container.set('validator', Container.get<ClassValidatorValidator>(ClassValidatorValidator))
  Container.set('tokenStrategy', Container.get<JwtTokenStrategyFactory>(JwtTokenStrategyFactory).create(config.jwt))

  const dataSourceOptions: PostgresConnectionOptions = {
    type: 'postgres',
    url: config.db.url,
    synchronize: config.db.synchronize,
    logging: config.db.logging,
    entities,
    subscribers,
    schema: config.db.schema,
    dropSchema: config.db.dropSchema,
  }
  const { connectionManager, dataSource: db } = createPostgresConnection(dataSourceOptions)
  Container.set(ConnectionManager, connectionManager)

  const app = express()

  nunjucks.configure([ path.resolve(dirname, '../templates'), path.resolve(__dirname, '../templates') ], {
    autoescape: true,
    express: app,
    watch: config.env === 'development',
    noCache: config.env !== 'production'
  })

  app.use((request, response, next) => {
    response.locals.siteName = 'ExamMe'
    response.locals.siteDescription = 'Practice exams and explore questions.'
    response.locals.requestPath = request.path
    response.locals.query = request.query
    response.locals.apiUrl = config.api_url
    const origin = request.protocol + '://' + request.get('host')
    response.locals.url = (name: Parameters<typeof url>[0], params = {}, query = {}, absolute = false) => url(name, params, query, absolute, origin)
    response.locals.staticUrl = (asset: string, absolute = false) => staticUrl(asset, absolute, origin)
    response.locals.examUrl = (exam: Parameters<typeof examUrl>[0], absolute = false) => examUrl(exam, absolute, origin)
    response.locals.questionUrl = (question: Parameters<typeof questionUrl>[0], exam: Parameters<typeof questionUrl>[1] = undefined, absolute = false) => questionUrl(question, exam, absolute, origin)
    response.locals.userUrl = (user: Parameters<typeof userUrl>[0], absolute = false) => userUrl(user, absolute, origin)
    next()
  })

  const context = { app, db, logger }
  configure(context)

  app.use((error: unknown, request: Request, response: Response) => {
    const statusCode = getErrorStatus(error)
    const detail = error instanceof Error ? error.message : 'Internal server error'
    const message = statusCode >= 500 ? 'Internal server error' : detail
    const wantsJson = request.headers.accept?.includes('application/json') || request.xhr
    if (wantsJson) {
      response.status(statusCode).json({ error: { status: statusCode, message } })
      return
    }
    response.status(statusCode).render('error.html', {
      title: statusCode >= 500 ? 'Internal Server Error' : message,
      statusCode,
      message: config.env === 'development' && statusCode >= 500 ? detail : statusCode < 500 ? message : undefined
    })
  })
  return context
}

export const createLambdaHandler = (context: ApplicationContext) => {
  let lambdaHandler: ((...args: unknown[]) => unknown) | undefined
  return async (event: unknown, lambdaContext: unknown): Promise<unknown> => {
    if (!lambdaHandler) {
      await initializePostgres(context.db, config.db.url, config.db.schema)
      lambdaHandler = serverlessExpress({ app: context.app })
    }
    return lambdaHandler(event, lambdaContext)
  }
}

export const startApp = async (context: ApplicationContext, name: string): Promise<void> => {
  await initializePostgres(context.db, config.db.url, config.db.schema)
  context.app.listen(config.app.port, '0.0.0.0', () => context.logger.info(`ExamMe ${ name } listening on ${ config.app.port }`))
}
