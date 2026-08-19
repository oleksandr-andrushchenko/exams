import { controllerRoute } from '../../shared/src/http'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import multer from 'multer'
import 'reflect-metadata'
import { ConnectionManager, useContainer as typeormUseContainer } from 'typeorm'
import { Container } from 'typedi'
import config from '../../shared/src/config'
import express, { NextFunction, Response } from 'express'
import LoggerInterface from '../../shared/src/services/logger/LoggerInterface'
import JwtTokenStrategyFactory from '../../shared/src/services/token/strategy/JwtTokenStrategyFactory'
import TokenStrategyInterface from '../../shared/src/services/token/strategy/TokenStrategyInterface'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'
import NullLogger from '../../shared/src/services/logger/NullLogger'
import ClassValidatorValidator from '../../shared/src/services/validator/ClassValidatorValidator'
import WinstonLogger from '../../shared/src/services/logger/WinstonLogger'
import { createServer, Server } from 'http'
import { subscribers } from '../../shared/src/subscribers'
import { entities } from '../../shared/src/entities'
import { getErrorStatus } from '../../shared/src/errors'
import cors from 'cors'
import compression from 'compression'
import morgan from 'morgan'
import { DataSource } from 'typeorm/data-source/DataSource'
import { createPostgresConnection, initializePostgres } from '../../shared/src/database/PostgresConnection'
import { MeController } from './controllers/MeController'
import { UserController } from './controllers/UserController'
import { ExamController } from './controllers/ExamController'
import { QuestionController } from './controllers/QuestionController'
import { ActivityController } from './controllers/ActivityController'
import { ExamSessionController } from './controllers/ExamSessionController'
import { ExamTagController } from './controllers/ExamTagController'
import { PermissionController } from './controllers/PermissionController'
import { AuthenticateController } from './controllers/AuthenticateController'

import serverlessExpress from '@vendia/serverless-express'

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

const { connectionManager, dataSource: db } = createPostgresConnection(dataSourceOptions)
Container.set(ConnectionManager, connectionManager)

const imageExtensions: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp'
}
const meController = Container.get<MeController>(MeController)
const userController = Container.get<UserController>(UserController)
const examController = Container.get<ExamController>(ExamController)
const questionController = Container.get<QuestionController>(QuestionController)
const activityController = Container.get<ActivityController>(ActivityController)
const examSessionController = Container.get<ExamSessionController>(ExamSessionController)
const examTagController = Container.get<ExamTagController>(ExamTagController)
const permissionController = Container.get<PermissionController>(PermissionController)
const authenticateController = Container.get<AuthenticateController>(AuthenticateController)

const uploadImage = multer({
  storage: multer.diskStorage({
    destination: path.resolve(process.cwd(), 'static'),
    filename: (_request, file, callback) => callback(null, randomUUID() + imageExtensions[file.mimetype])
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) =>
    callback(null, Object.prototype.hasOwnProperty.call(imageExtensions, file.mimetype))
}).single('image')

export const initializeDb = async (dataSource: DataSource): Promise<void> => {
  await initializePostgres(dataSource, config.db.url, config.db.schema)
}

const serverDown = async (server: Server, callback: () => void): Promise<void> => {
  server.close(() => {
    logger.info('Server closed')
    db.destroy().then(() => {
      logger.info('Database connection closed')
      callback()
    })
  })
}

const app = express()

app.use(morgan(loggerFormat, { stream: { write: logger.info.bind(logger) } }))
app.use(cors({ origin: config.client_url, credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use((request, _response, next) => {
  if (
    ([ 'POST', 'PUT', 'PATCH' ].includes(request.method) && !request.headers['content-length']) ||
    request.headers['content-length'] === '0'
  ) {
    request.body = undefined
  }
  next()
})

app.post('/login', controllerRoute(authenticateController, 'login'))
app.post('/logout', controllerRoute(authenticateController, 'logout'))
app.get('/me', controllerRoute(meController, 'getMe'))
app.patch('/users/:userId', controllerRoute(userController, 'updateUser'))
app.post('/exams', controllerRoute(examController, 'createExam'))
app.patch('/exams/:examId', controllerRoute(examController, 'updateExamRoute'))
app.patch('/questions/:questionId', controllerRoute(questionController, 'updateQuestionRoute'))
app.post('/questions/:questionId/rating', controllerRoute(questionController, 'rateQuestionRoute'))
app.post('/auth/token', controllerRoute(authenticateController, 'token'))
app.post('/me', controllerRoute(meController, 'createMe'))
app.patch('/me', controllerRoute(meController, 'updateMe'))
app.delete('/me', controllerRoute(meController, 'deleteMe'))
app.get('/users', controllerRoute(userController, 'getUsers'))
app.get('/users/:userId', controllerRoute(userController, 'getUser'))
app.post('/users', controllerRoute(userController, 'createUser'))
app.delete('/users/:userId', controllerRoute(userController, 'deleteUser'))
app.get('/exams', controllerRoute(examController, 'getExamsRoute'))
app.post('/exams/:examId/rating', controllerRoute(examController, 'rateExamRoute'))
app.get('/exams/:examId', controllerRoute(examController, 'getExamRoute'))
app.delete('/exams/:examId', controllerRoute(examController, 'deleteExamRoute'))
app.post('/exams/:examId/approve', controllerRoute(examController, 'approveExamRoute'))
app.get('/questions', controllerRoute(questionController, 'getQuestionsRoute'))
app.get('/questions/:questionId', controllerRoute(questionController, 'getQuestionRoute'))
app.post('/questions', controllerRoute(questionController, 'createQuestionRoute'))
app.delete('/questions/:questionId', controllerRoute(questionController, 'deleteQuestionRoute'))
app.post('/questions/:questionId/approve', controllerRoute(questionController, 'approveQuestionRoute'))
app.post('/exam-sessions', controllerRoute(examSessionController, 'createRoute'))
app.get('/exam-sessions', controllerRoute(examSessionController, 'listRoute'))
app.get('/exam-sessions/current', controllerRoute(examSessionController, 'currentRoute'))
app.post('/exam-sessions/:examSessionId/completion', controllerRoute(examSessionController, 'completionRoute'))
app.delete('/exam-sessions/:examSessionId', controllerRoute(examSessionController, 'deleteRoute'))
app.delete(
  '/exam-sessions/:examSessionId/questions/:question/answer',
  controllerRoute(examSessionController, 'answerDeleteRoute')
)
app.get('/exam-sessions/:examSessionId', controllerRoute(examSessionController, 'getRoute'))
app.get('/exam-sessions/:examSessionId/questions/:question', controllerRoute(examSessionController, 'questionRoute'))
app.post(
  '/exam-sessions/:examSessionId/questions/:question/answer',
  controllerRoute(examSessionController, 'answerRoute')
)
app.get('/exam-tags', controllerRoute(examTagController, 'route'))
app.get('/activities', controllerRoute(activityController, 'route'))
app.get('/permissions', controllerRoute(permissionController, 'route'))
app.post('/upload', uploadImage, controllerRoute(userController, 'upload'))

app.use(compression())
app.use((error: unknown, _request: unknown, response: Response, next: NextFunction) => {
  next
  const status = getErrorStatus(error)
  response.status(status).json({
    error: { status, message: error instanceof Error ? error.message : 'Internal server error' }
  })
})

let lambdaHandler: ((...args: unknown[]) => unknown) | undefined

export const handler = async (event: unknown, context: unknown): Promise<unknown> => {
  if (!lambdaHandler) {
    await initializeDb(db)
    lambdaHandler = serverlessExpress({ app })
  }
  return lambdaHandler(event, context)
}

if (require.main === module) {
  const start = async (): Promise<void> => {
    await initializeDb(db)
    const server = createServer(app)

    const port = config.app.port
    server.listen({ port }, () => logger.info(`Server is running on port ${ port }`))

    const failureHandler = (error: Error) => {
      logger.error(error.message)
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
  start().catch((error) => {
    logger.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
