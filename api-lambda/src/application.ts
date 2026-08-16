import { randomUUID } from 'node:crypto'
import path from 'node:path'
import { plainToInstance } from 'class-transformer'
import multer from 'multer'
import 'reflect-metadata'
import { ConnectionManager, useContainer as typeormUseContainer } from 'typeorm'
import { Container } from 'typedi'
import config from './configuration'
import express, { Application, RequestHandler } from 'express'
import LoggerInterface from './services/logger/LoggerInterface'
import JwtTokenStrategyFactory from './services/token/strategy/JwtTokenStrategyFactory'
import TokenStrategyInterface from './services/token/strategy/TokenStrategyInterface'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'
import NullLogger from './services/logger/NullLogger'
import ClassValidatorValidator from './services/validator/ClassValidatorValidator'
import WinstonLogger from './services/logger/WinstonLogger'
import { createServer, Server } from 'http'
import { subscribers } from './subscribers'
import { entities } from './entities'
import { AuthCheckerService } from './services/auth/AuthCheckerService'
import cors from 'cors'
import compression from 'compression'
import morgan from 'morgan'
import { DataSource } from 'typeorm/data-source/DataSource'
import { Client } from 'pg'
import UserProvider from './services/user/UserProvider'
import TokenService from './services/token/TokenService'
import { MeController } from './controllers/MeController'
import { UserController } from './controllers/UserController'
import { ExamController } from './controllers/ExamController'
import { QuestionController } from './controllers/QuestionController'
import CreateMe from './schema/user/CreateMe'
import UpdateUser from './schema/user/UpdateUser'
import GetUser from './schema/user/GetUser'
import CreateExam from './schema/exam/CreateExam'
import UpdateExam from './schema/exam/UpdateExam'
import GetExam from './schema/exam/GetExam'
import UpdateQuestion from './schema/question/UpdateQuestion'
import GetQuestion from './schema/question/GetQuestion'
import RateQuestionRequest from './schema/question/RateQuestionRequest'
import { Credentials } from './schema/auth/Credentials'
import UpdateMe from './schema/user/UpdateMe'
import CreateUser from './schema/user/CreateUser'
import GetUsers from './schema/user/GetUsers'
import GetExams from './schema/exam/GetExams'
import GetQuestions from './schema/question/GetQuestions'
import CreateQuestion from './schema/question/CreateQuestion'
import GetExamSessions from './schema/examSession/GetExamSessions'
import CreateExamSession from './schema/examSession/CreateExamSession'
import GetExamSession from './schema/examSession/GetExamSession'
import GetExamSessionQuestion from './schema/examSession/GetExamSessionQuestion'
import CreateExamSessionQuestionAnswer from './schema/examSession/CreateExamSessionQuestionAnswer'
import GetCurrentExamSessions from './schema/examSession/GetCurrentExamSessions'
import GetExamTags from './schema/examTag/GetExamTags'
import ActivityQuery from './schema/activity/ActivityQuery'
import { ActivityController } from './controllers/ActivityController'
import { ExamSessionController } from './controllers/ExamSessionController'
import { ExamTagController } from './controllers/ExamTagController'
import { PermissionController } from './controllers/PermissionController'
import { AuthenticateController } from './controllers/AuthenticateController'

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

const imageExtensions: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp'
}
const userProvider = Container.get<UserProvider>(UserProvider)
const tokenService = Container.get<TokenService>(TokenService)
const meController = Container.get<MeController>(MeController)
const userController = Container.get<UserController>(UserController)
const examController = Container.get<ExamController>(ExamController)
const questionController = Container.get<QuestionController>(QuestionController)
const activityController = Container.get<ActivityController>(ActivityController)
const examSessionController = Container.get<ExamSessionController>(ExamSessionController)
const examTagController = Container.get<ExamTagController>(ExamTagController)
const permissionController = Container.get<PermissionController>(PermissionController)
const authenticateController = Container.get<AuthenticateController>(AuthenticateController)

const ah =
  (handler: RequestHandler): RequestHandler =>
  (request, response, next) =>
    Promise.resolve(handler(request, response, next)).catch(next)

const getCurrentUser = (request: Parameters<RequestHandler>[0]) => authChecker.getContextUser(request)
const withExamTags = async (exam: any): Promise<any> => ({
  ...exam,
  tags: await Promise.all(
    (await examController.getTags(exam)).map(async (tag) => ({
      ...tag,
      examsCount: await examTagController.getExamsCount(tag)
    }))
  )
})
const queryObject = (query: Parameters<RequestHandler>[0]['query']): Record<string, unknown> => {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) result[key] = value[0]
    else if (value === 'true' || value === 'false') result[key] = value === 'true'
    else if (typeof value === 'string' && value !== '' && /^\d+$/.test(value)) result[key] = Number(value)
    else result[key] = value
  }
  return result
}

const statusByErrorName: Record<string, number> = {
  ValidatorError: 400,
  UserWrongCredentialsError: 401,
  AuthorizationFailedError: 403,
  ExamNotFoundError: 404,
  UserEmailNotFoundError: 404,
  QuestionNotFoundError: 404,
  UserNotFoundError: 404,
  ExamNameTakenError: 409,
  QuestionTitleTakenError: 409,
  UserEmailTakenError: 409,
  ExamSessionTakenError: 409,
  ExamSessionNotFoundError: 404,
  ExamSessionQuestionNumberNotFoundError: 404,
  ExamNotApprovedError: 409,
  ExamWithoutApprovedQuestionsError: 409
}

const getErrorStatus = (error: unknown): number => {
  if (error instanceof Error && error.constructor.name in statusByErrorName) {
    return statusByErrorName[error.constructor.name]
  }
  return 500
}

const uploadImage = multer({
  storage: multer.diskStorage({
    destination: path.resolve(process.cwd(), 'static'),
    filename: (_request, file, callback) => callback(null, randomUUID() + imageExtensions[file.mimetype])
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_request, file, callback) =>
    callback(null, Object.prototype.hasOwnProperty.call(imageExtensions, file.mimetype))
}).single('image')

export const initializeDb = async (db: DataSource): Promise<void> => {
  const schema = config.db.schema.replace(/\"/g, '\"\"')
  const client = new Client({ connectionString: config.db.url })
  await client.connect()
  await client.query('CREATE SCHEMA IF NOT EXISTS \"' + schema + '\"')
  await client.end()
  await db.initialize()
}

export const createApplication = async (beforePrepare?: (app: Application) => void): Promise<Application> => {
  const app = express()
  beforePrepare?.(app)

  app.use(morgan(loggerFormat, { stream: { write: logger.info.bind(logger) } }))
  app.use(cors({ origin: config.client_url, credentials: true }))
  app.use(express.json({ limit: '10mb' }))

  app.post(
    '/login',
    ah(async (request, response) => {
      const target =
        typeof request.body.redirect === 'string' &&
        request.body.redirect.startsWith('/') &&
        !request.body.redirect.startsWith('//')
          ? request.body.redirect
          : '/'
      try {
        const user = await userProvider.getUserByCredentials(
          plainToInstance(Credentials, {
            email: request.body.email,
            password: request.body.password
          })
        )
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
  )

  app.post(
    '/logout',
    ah(async (_request, response) => {
      response.clearCookie('authenticationToken')
      response.json({ redirect: config.client_url })
    })
  )

  app.get(
    '/me',
    ah(async (request, response) => {
      const user = await getCurrentUser(request)
      if (!user) {
        response.status(401).json({ error: { status: 401, message: 'Authentication required' } })
        return
      }
      response.json(user)
    })
  )

  app.patch(
    '/users/:userId',
    ah(async (request, response) => {
      const user = await getCurrentUser(request)
      if (!user) {
        response.status(401).json({ error: { status: 401, message: 'Authentication required' } })
        return
      }
      const updated = await userController.updateUser(
        plainToInstance(GetUser, { userId: request.params.userId }),
        plainToInstance(UpdateUser, request.body),
        user
      )
      response.json(updated)
    })
  )

  app.post(
    '/exams',
    ah(async (request, response) => {
      const user = await getCurrentUser(request)
      if (!user) {
        response.status(401).json({ error: { status: 401, message: 'Authentication required' } })
        return
      }
      const exam = await examController.createExam(plainToInstance(CreateExam, request.body), user)
      response.status(201).json(await withExamTags(exam))
    })
  )

  app.patch(
    '/exams/:examId',
    ah(async (request, response) => {
      const user = await getCurrentUser(request)
      if (!user) {
        response.status(401).json({ error: { status: 401, message: 'Authentication required' } })
        return
      }
      const exam = await examController.updateExam(
        plainToInstance(GetExam, { examId: request.params.examId }),
        plainToInstance(UpdateExam, request.body),
        user
      )
      response.json(await withExamTags(exam))
    })
  )

  app.patch(
    '/questions/:questionId',
    ah(async (request, response) => {
      const user = await getCurrentUser(request)
      if (!user) {
        response.status(401).json({ error: { status: 401, message: 'Authentication required' } })
        return
      }
      const question = await questionController.updateQuestion(
        plainToInstance(GetQuestion, { questionId: request.params.questionId }),
        plainToInstance(UpdateQuestion, request.body),
        user
      )
      response.json(question)
    })
  )

  app.post(
    '/questions/:questionId/rating',
    ah(async (request, response) => {
      const user = await getCurrentUser(request)
      if (!user) {
        response.status(401).json({ error: { status: 401, message: 'Authentication required' } })
        return
      }
      const question = await questionController.rateQuestion(
        plainToInstance(RateQuestionRequest, { questionId: request.params.questionId, mark: request.body.mark }),
        user
      )
      const rating = await questionController.getQuestionRating(question, user)
      response.json({ id: question.id.toString(), html: rating?.html })
    })
  )

  const requireUser = async (request: Parameters<RequestHandler>[0], response: Parameters<RequestHandler>[1]) => {
    const user = await getCurrentUser(request)
    if (!user) {
      response.status(401).json({ error: { status: 401, message: 'Authentication required' } })
      return undefined
    }
    return user
  }

  app.post(
    '/auth/token',
    ah(async (request, response) => {
      response.json(await authenticateController.createAuthenticationToken(plainToInstance(Credentials, request.body)))
    })
  )

  app.post(
    '/me',
    ah(async (request, response) => {
      response.status(201).json(await meController.createMe(plainToInstance(CreateMe, request.body)))
    })
  )

  app.patch(
    '/me',
    ah(async (request, response) => {
      const user = await requireUser(request, response)
      if (user) response.json(await meController.updateMe(plainToInstance(UpdateMe, request.body), user))
    })
  )

  app.delete(
    '/me',
    ah(async (request, response) => {
      const user = await requireUser(request, response)
      if (user) response.json({ deleted: await meController.deleteMe(user) })
    })
  )

  app.get(
    '/users',
    ah(async (request, response) => {
      response.json(await userController.getUsers(plainToInstance(GetUsers, queryObject(request.query))))
    })
  )

  app.get(
    '/users/:userId',
    ah(async (request, response) => {
      response.json(await userController.getUser(plainToInstance(GetUser, { userId: request.params.userId })))
    })
  )

  app.post(
    '/users',
    ah(async (request, response) => {
      const user = await requireUser(request, response)
      if (user)
        response.status(201).json(await userController.createUser(plainToInstance(CreateUser, request.body), user))
    })
  )

  app.delete(
    '/users/:userId',
    ah(async (request, response) => {
      const user = await requireUser(request, response)
      if (user)
        response.json({
          deleted: await userController.deleteUser(plainToInstance(GetUser, { userId: request.params.userId }), user)
        })
    })
  )

  app.get(
    '/exams',
    ah(async (request, response) => {
      response.json(
        await examController.getExams(
          plainToInstance(GetExams, queryObject(request.query)),
          await getCurrentUser(request)
        )
      )
    })
  )

  app.post(
    '/exams/:examId/rating',
    ah(async (_request, response) => {
      response.status(404).json({ error: { status: 404, message: 'Exam rating is not available' } })
    })
  )

  app.get(
    '/exams/:examId',
    ah(async (request, response) => {
      response.json(await examController.getExam(plainToInstance(GetExam, { examId: request.params.examId })))
    })
  )

  app.delete(
    '/exams/:examId',
    ah(async (request, response) => {
      const user = await requireUser(request, response)
      if (user)
        response.json({
          deleted: await examController.deleteExam(plainToInstance(GetExam, { examId: request.params.examId }), user)
        })
    })
  )

  app.post(
    '/exams/:examId/approve',
    ah(async (request, response) => {
      const user = await requireUser(request, response)
      if (user)
        response.json(
          await examController.toggleExamApprove(plainToInstance(GetExam, { examId: request.params.examId }), user)
        )
    })
  )

  app.get(
    '/questions',
    ah(async (request, response) => {
      response.json(
        await questionController.getQuestions(
          plainToInstance(GetQuestions, queryObject(request.query)),
          await getCurrentUser(request)
        )
      )
    })
  )

  app.get(
    '/questions/:questionId',
    ah(async (request, response) => {
      response.json(
        await questionController.getQuestion(plainToInstance(GetQuestion, { questionId: request.params.questionId }))
      )
    })
  )

  app.post(
    '/questions',
    ah(async (request, response) => {
      const user = await requireUser(request, response)
      if (user)
        response
          .status(201)
          .json(await questionController.createQuestion(plainToInstance(CreateQuestion, request.body), user))
    })
  )

  app.delete(
    '/questions/:questionId',
    ah(async (request, response) => {
      const user = await requireUser(request, response)
      if (user)
        response.json({
          deleted: await questionController.deleteQuestion(
            plainToInstance(GetQuestion, { questionId: request.params.questionId }),
            user
          )
        })
    })
  )

  app.post(
    '/questions/:questionId/approve',
    ah(async (request, response) => {
      const user = await requireUser(request, response)
      if (user)
        response.json(
          await questionController.toggleQuestionApprove(
            plainToInstance(GetQuestion, { questionId: request.params.questionId }),
            user
          )
        )
    })
  )

  app.post(
    '/exam-sessions',
    ah(async (request, response) => {
      const user = await requireUser(request, response)
      if (user)
        response
          .status(201)
          .json(await examSessionController.createExamSession(plainToInstance(CreateExamSession, request.body), user))
    })
  )

  app.get(
    '/exam-sessions',
    ah(async (request, response) => {
      const user = await requireUser(request, response)
      if (user) {
        const { meta, ...sessionQuery } = queryObject(request.query)
        const requestData = plainToInstance(GetExamSessions, sessionQuery)
        response.json(
          await (meta
            ? examSessionController.getPaginatedExamSessions(requestData, user)
            : examSessionController.getExamSessions(requestData, user))
        )
      }
    })
  )

  app.get(
    '/exam-sessions/current',
    ah(async (request, response) => {
      const user = await requireUser(request, response)
      if (user) {
        const examIds = Array.isArray(request.query.examIds)
          ? request.query.examIds
          : String(request.query.examIds ?? '').split(',')
        response.json(
          await examSessionController.getCurrentExamSessions(plainToInstance(GetCurrentExamSessions, { examIds }), user)
        )
      }
    })
  )

  app.post(
    '/exam-sessions/:examSessionId/completion',
    ah(async (request, response) => {
      const user = await requireUser(request, response)
      if (user)
        response.json(
          await examSessionController.createExamSessionCompletion(
            plainToInstance(GetExamSession, { examSessionId: request.params.examSessionId }),
            user
          )
        )
    })
  )

  app.delete(
    '/exam-sessions/:examSessionId',
    ah(async (request, response) => {
      const user = await requireUser(request, response)
      if (user)
        response.json({
          deleted: await examSessionController.deleteExamSession(
            plainToInstance(GetExamSession, { examSessionId: request.params.examSessionId }),
            user
          )
        })
    })
  )

  app.delete(
    '/exam-sessions/:examSessionId/questions/:question/answer',
    ah(async (request, response) => {
      const user = await requireUser(request, response)
      if (user)
        response.json(
          await examSessionController.deleteExamSessionQuestionAnswer(
            plainToInstance(GetExamSessionQuestion, {
              examSessionId: request.params.examSessionId,
              question: Number(request.params.question)
            }),
            user
          )
        )
    })
  )

  app.get(
    '/exam-sessions/:examSessionId',
    ah(async (request, response) => {
      const user = await requireUser(request, response)
      if (user)
        response.json(
          await examSessionController.getExamSession(
            plainToInstance(GetExamSession, { examSessionId: request.params.examSessionId }),
            user
          )
        )
    })
  )

  app.get(
    '/exam-sessions/:examSessionId/questions/:question',
    ah(async (request, response) => {
      const user = await requireUser(request, response)
      if (user)
        response.json(
          await examSessionController.getExamSessionQuestion(
            plainToInstance(GetExamSessionQuestion, {
              examSessionId: request.params.examSessionId,
              question: Number(request.params.question)
            }),
            user
          )
        )
    })
  )

  app.post(
    '/exam-sessions/:examSessionId/questions/:question/answer',
    ah(async (request, response) => {
      const user = await requireUser(request, response)
      if (user)
        response.json(
          await examSessionController.createExamSessionQuestionAnswer(
            plainToInstance(GetExamSessionQuestion, {
              examSessionId: request.params.examSessionId,
              question: Number(request.params.question)
            }),
            plainToInstance(CreateExamSessionQuestionAnswer, request.body),
            user
          )
        )
    })
  )

  app.get(
    '/exam-tags',
    ah(async (request, response) => {
      const tags = await examTagController.getExamTags(plainToInstance(GetExamTags, queryObject(request.query)))
      response.json(
        await Promise.all(tags.map(async (tag) => ({ ...tag, examsCount: await examTagController.getExamsCount(tag) })))
      )
    })
  )

  app.get(
    '/activities',
    ah(async (request, response) => {
      response.json(await activityController.getActivities(plainToInstance(ActivityQuery, queryObject(request.query))))
    })
  )

  app.get(
    '/permissions',
    ah(async (request, response) => {
      const user = await requireUser(request, response)
      if (user) response.json(await permissionController.getPermission())
    })
  )

  app.post(
    '/upload',
    ah(async (request, response, next) => {
      const user = await authChecker.getContextUser(request)
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
  )

  app.use(compression())
  app.use((error: unknown, _request: unknown, response: any, _next: unknown) => {
    const status = getErrorStatus(error)
    response.status(status).json({
      error: { status, message: error instanceof Error ? error.message : 'Internal server error' }
    })
  })

  return app
}

export const serverUp = async (): Promise<void> => {
  await initializeDb(db)

  const app = await createApplication()
  const server = createServer(app)

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

export const testServerDown = async (): Promise<void> => {
  db.destroy().then(() => logger.info('Database connection closed'))
}

export const serverless = async (): Promise<Function> => {
  await initializeDb(db)

  const app = await createApplication()

  // todo: add process signals processing/handlers

  return serverlessExpress({ app })
}
