import { controllerRoute } from '../../shared/src/http'
import { createPostgresConnection, initializePostgres } from '../../shared/src/database/PostgresConnection'
import { entities } from '../../shared/src/entities'
import { ConnectionManager, useContainer as typeormUseContainer } from 'typeorm'
import { Container } from 'typedi'
import 'reflect-metadata'
import config from '../../shared/src/config'
import { examUrl, questionUrl, staticUrl, url, userUrl } from './routes'
import express, { type Request, type Response } from 'express'
import path from 'node:path'
import nunjucks from 'nunjucks'
import JwtTokenStrategyFactory from '../../shared/src/services/token/strategy/JwtTokenStrategyFactory'
import AuthUserProvider from '../../shared/src/services/auth/AuthUserProvider'
import AuthorizationVerifier from '../../shared/src/services/auth/AuthorizationVerifier'
import ClassValidatorValidator from '../../shared/src/services/validator/ClassValidatorValidator'
import serverless from 'serverless-http'
import { getErrorStatus, namedError } from '../../shared/src/errors'
import HomeController from './controllers/HomeController'
import ExamController from './controllers/ExamController'
import QuestionController from './controllers/QuestionController'
import UserController from './controllers/UserController'
import TagController from './controllers/TagController'
import AuthController from './controllers/AuthController'

typeormUseContainer(Container)
const { connectionManager, dataSource: db } = createPostgresConnection({
  type: 'postgres',
  url: config.db.url,
  schema: config.db.schema,
  entities,
  synchronize: config.db.synchronize
})
Container.set(ConnectionManager, connectionManager)
Container.set('tokenStrategy', Container.get<JwtTokenStrategyFactory>(JwtTokenStrategyFactory).create(config.jwt))
Container.set('validatorOptions', config.validator)
Container.set('validator', Container.get<ClassValidatorValidator>(ClassValidatorValidator))
Container.set('authPermissions', config.auth.permissions)
const authUserProvider = Container.get<AuthUserProvider>(AuthUserProvider)
const authorizationVerifier = Container.get<AuthorizationVerifier>(AuthorizationVerifier)
const homeController = Container.get(HomeController)
const examPageController = Container.get(ExamController)
const questionPageController = Container.get(QuestionController)
const userPageController = Container.get(UserController)
const tagController = Container.get(TagController)
const authPageController = Container.get(AuthController)

const app = express()

const templateDir = path.resolve(__dirname, '../templates')
const sharedTemplateDir = path.resolve(__dirname, '../../shared/templates')
const staticDir = path.resolve(__dirname, '../../static')
nunjucks.configure([ templateDir, sharedTemplateDir ], {
  autoescape: true,
  express: app,
  noCache: config.env !== 'production'
})
app.use(express.urlencoded({ extended: true }))

app.use('/static', express.static(staticDir, { maxAge: config.env === 'production' ? '1d' : 0 }))

app.use((request, response, next) => {
  response.locals.siteName = 'ExamMe'
  response.locals.siteDescription = 'Practice exams and explore questions.'
  response.locals.requestPath = request.path
  response.locals.query = request.query
  response.locals.apiUrl = config.api_url
  const origin = request.protocol + '://' + request.get('host')
  response.locals.url = (name: Parameters<typeof url>[0], params = {}, query = {}, absolute = false) =>
    url(name, params, query, absolute, origin)
  response.locals.staticUrl = (asset: string, absolute = false) => staticUrl(asset, absolute, origin)
  response.locals.examUrl = (exam: Parameters<typeof examUrl>[0], absolute = false) => examUrl(exam, absolute, origin)
  response.locals.questionUrl = (
    question: Parameters<typeof questionUrl>[0],
    exam: Parameters<typeof questionUrl>[1] = undefined,
    absolute = false
  ) => questionUrl(question, exam, absolute, origin)
  response.locals.userUrl = (user: Parameters<typeof userUrl>[0], absolute = false) => userUrl(user, absolute, origin)
  next()
})

app.use(async (request, response, next) => {
  const user = await authUserProvider.getAuthUser(request)
  response.locals.currentUser = user
  const editablePermissions = new Set<string>()
  if (user) {
    await Promise.all(
      [ 'updateExam', 'updateQuestion', 'updateUser' ].map(async (permission) => {
        if (await authorizationVerifier.hasAuthorization(user, permission)) editablePermissions.add(permission)
      })
    )
  }
  response.locals.canEdit = (permission: string) => editablePermissions.has(permission)
  next()
})

app.get('/', controllerRoute(homeController, 'getHome', 'html'))
app.get('/exams', controllerRoute(examPageController, 'listExams', 'html'))
app.get('/questions', controllerRoute(questionPageController, 'listQuestions', 'html'))
app.get('/users', controllerRoute(userPageController, 'listUsers', 'html'))
app.get('/users/:userId/edit', controllerRoute(userPageController, 'editUser', 'html'))
app.get('/exams/:examId/edit', controllerRoute(examPageController, 'editExam', 'html'))
app.get('/questions/:questionId/edit', controllerRoute(questionPageController, 'editQuestion', 'html'))
app.get('/exams/new', controllerRoute(examPageController, 'createExamPage', 'html'))
app.get('/exams/:examId', controllerRoute(examPageController, 'getExam', 'html'))
app.get('/questions/new', controllerRoute(questionPageController, 'createQuestionPage', 'html'))
app.get('/questions/:questionId', controllerRoute(questionPageController, 'getQuestion', 'html'))
app.get('/users/:userId', controllerRoute(userPageController, 'getUser', 'html'))
app.get('/tags/:slug', controllerRoute(tagController, 'getTag', 'html'))
app.get('/login', controllerRoute(authPageController, 'getLoginPage', 'html'))
app.get('/register', controllerRoute(authPageController, 'getRegisterPage', 'html'))
app.get('/:userSlug/:examSlug/:questionSlug', controllerRoute(questionPageController, 'getPublicQuestion', 'html'))
app.get('/:userSlug/:examSlug', controllerRoute(examPageController, 'getPublicExam', 'html'))
app.get('/:userSlug', controllerRoute(userPageController, 'getPublicUser', 'html'))

app.use((_request, _response, next) => next(namedError('PageNotFoundError', 'Page not found')))

app.use((error: unknown, request: Request, response: Response) => {
  console.error('Web request failed', error instanceof Error ? error.stack : error)
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
    message: isDevelopmentEnvironment() && statusCode >= 500 ? detail : statusCode < 500 ? message : undefined
  })
})

export const isDevelopmentEnvironment = (environment = config.env): boolean => environment === 'development'

export { app, db }
let lambdaHandler: ReturnType<typeof serverless> | undefined
export const handler = async (event: unknown, context: unknown): Promise<unknown> => {
  if (!db.isInitialized) await initializePostgres(db, config.db.url, config.db.schema)
  lambdaHandler ??= serverless(app)
  return (lambdaHandler as (event: unknown, context: unknown) => unknown)(event, context)
}

if (process.argv[1]?.endsWith('web-lambda/src/server.ts')) {
  initializePostgres(db, config.db.url, config.db.schema)
    .then(() => {
      app.listen(config.app.port, '0.0.0.0', () => console.log(`ExamMe web listening on ${ config.app.port }`))
    })
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
