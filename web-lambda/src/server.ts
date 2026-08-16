import { isDevelopmentEnvironment } from './environment'
import { examUrl, questionUrl, route, staticUrl, url, userUrl } from './routes'
import bcrypt from 'bcryptjs'
import express, { type Request, type RequestHandler, type Response } from 'express'
import * as jwt from 'jsonwebtoken'
import path from 'node:path'
import nunjucks from 'nunjucks'
import serverless from 'serverless-http'
import {
  getExam,
  getExamList,
  getHomeData,
  getQuestion,
  getQuestionList,
  getTag,
  getUser,
  getUserCredentials,
  getUserExams,
  getUserExamSessions,
  getUserList
} from './data'

const app = express()

const ah =
  (handler: RequestHandler): RequestHandler =>
  (request, response, next) =>
    Promise.resolve(handler(request, response, next)).catch(next)

class HttpError extends Error {
  public constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message)
  }
}

const canViewUnapproved = (user: { permissions?: string[] } | undefined, permission: string) =>
  user?.permissions?.some(
    (userPermission) => userPermission === permission || userPermission === 'root' || userPermission === '*'
  ) ?? false
const templateDir = path.resolve(__dirname, '../templates')
const sharedTemplateDir = path.resolve(__dirname, '../../lambda-shared/templates')
const staticDir = path.resolve(__dirname, '../../static')
nunjucks.configure([templateDir, sharedTemplateDir], {
  autoescape: true,
  express: app,
  noCache: process.env.NODE_ENV !== 'production'
})
app.use(express.urlencoded({ extended: true }))

app.use('/static', express.static(staticDir, { maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0 }))

app.use((request, response, next) => {
  response.locals.siteName = 'ExamMe'
  response.locals.siteDescription = 'Practice exams and explore questions.'
  response.locals.requestPath = request.path
  response.locals.query = request.query
  response.locals.apiUrl = process.env.API_URL || 'http://localhost:8080'
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
  response.locals.canEdit = (permission: string) => canViewUnapproved(response.locals.currentUser, permission)
  next()
})

app.use(async (request, response, next) => {
  const token = request.headers.cookie
    ?.split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith('authenticationToken='))
    ?.slice('authenticationToken='.length)

  if (token) {
    try {
      const payload = jwt.verify(token, 'any') as { userId?: string; type?: string }
      if (payload.type === 'access' && payload.userId) {
        response.locals.currentUser = await getUser(payload.userId)
      }
    } catch {
      // Treat an absent, expired, or invalid token as an anonymous session.
    }
  }

  next()
})

const redirectPath = (value: unknown, fallback = '/') =>
  typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : fallback
const number = (value: unknown, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}
const queryFilters = (request: Request) => ({
  search: typeof request.query.search === 'string' ? request.query.search : undefined,
  approved: typeof request.query.approved === 'string' ? request.query.approved : undefined,
  difficulty: typeof request.query.difficulty === 'string' ? request.query.difficulty : undefined,
  type: typeof request.query.type === 'string' ? request.query.type : undefined,
  tag: typeof request.query.tag === 'string' ? request.query.tag : undefined,
  exam: typeof request.query.exam === 'string' ? request.query.exam : undefined,
  page: number(request.query.page, 1),
  size: Math.min(50, number(request.query.size, 20)),
  sort: typeof request.query.sort === 'string' ? request.query.sort : undefined,
  order: request.query.order === 'asc' ? 'asc' : 'desc'
})

app.get(
  '/',
  ah(async (_request, response) => {
    response.render('home.html', {
      data: await getHomeData(
        8,
        canViewUnapproved(response.locals.currentUser, 'getExam'),
        canViewUnapproved(response.locals.currentUser, 'getQuestion')
      ),
      title: 'Home'
    })
  })
)

app.get(
  '/exams',
  ah(async (request, response) => {
    response.render('exams.html', {
      page: await getExamList(queryFilters(request), canViewUnapproved(response.locals.currentUser, 'getExam')),
      filters: queryFilters(request),
      title: 'Exams'
    })
  })
)

app.get(
  '/questions',
  ah(async (request, response) => {
    response.render('questions.html', {
      page: await getQuestionList(queryFilters(request), canViewUnapproved(response.locals.currentUser, 'getQuestion')),
      filters: queryFilters(request),
      title: 'Questions'
    })
  })
)

app.get(
  '/users',
  ah(async (request, response) => {
    response.render('users.html', {
      page: await getUserList(queryFilters(request)),
      filters: queryFilters(request),
      title: 'Users'
    })
  })
)

app.get(
  '/users/:userId/edit',
  ah(async (request, response) => {
    if (!response.locals.currentUser || !canViewUnapproved(response.locals.currentUser, 'updateUser')) {
      throw new HttpError(
        response.locals.currentUser ? 403 : 401,
        response.locals.currentUser ? 'You are not authorized to edit this resource' : 'Authentication required'
      )
    }
    const user = await getUser(request.params.userId)
    if (!user) throw new HttpError(404, 'User not found')
    response.render('edit.html', { resource: 'user', user })
  })
)

app.get(
  '/exams/:examId/edit',
  ah(async (request, response) => {
    if (!response.locals.currentUser || !canViewUnapproved(response.locals.currentUser, 'updateExam')) {
      throw new HttpError(
        response.locals.currentUser ? 403 : 401,
        response.locals.currentUser ? 'You are not authorized to edit this resource' : 'Authentication required'
      )
    }
    const exam = await getExam(request.params.examId, true)
    if (!exam) throw new HttpError(404, 'Exam not found')
    response.render('edit.html', { resource: 'exam', exam })
  })
)

app.get(
  '/questions/:questionId/edit',
  ah(async (request, response) => {
    if (!response.locals.currentUser || !canViewUnapproved(response.locals.currentUser, 'updateQuestion')) {
      throw new HttpError(
        response.locals.currentUser ? 403 : 401,
        response.locals.currentUser ? 'You are not authorized to edit this resource' : 'Authentication required'
      )
    }
    const question = await getQuestion(request.params.questionId, response.locals.currentUser.id, true)
    if (!question) throw new HttpError(404, 'Question not found')
    response.render('edit.html', { resource: 'question', question })
  })
)

app.get('/exams/new', (request, response) => {
  if (!response.locals.currentUser) {
    response.redirect(route('login', {}, { redirect: route('newExam') }))
    return
  }
  response.render('create-exam.html', { title: 'Create exam' })
})

app.get(
  '/exams/:examId',
  ah(async (request, response) => {
    const exam = await getExam(request.params.examId, canViewUnapproved(response.locals.currentUser, 'getExam'))
    if (!exam) throw new HttpError(404, 'Exam not found')
    response.render('exam.html', { exam, title: exam.name })
  })
)

app.get(
  '/questions/new',
  ah(async (request, response) => {
    const user = response.locals.currentUser
    if (!user) throw new HttpError(401, 'Authentication required')
    const exam = await getExam(String(request.query.exam || ''), true)
    if (!exam) throw new HttpError(404, 'Exam not found')
    if (exam.ownerId?.toString() !== user.id?.toString())
      throw new HttpError(403, 'You are not authorized to add questions')
    response.render('create-question.html', { exam, title: 'Add question' })
  })
)

app.get(
  '/questions/:questionId',
  ah(async (request, response) => {
    const question = await getQuestion(
      request.params.questionId,
      response.locals.currentUser?.id,
      canViewUnapproved(response.locals.currentUser, 'getQuestion')
    )
    if (!question) throw new HttpError(404, 'Question not found')
    response.render('question.html', { question, title: question.title })
  })
)

app.get(
  '/users/:userId',
  ah(async (request, response) => {
    const user = await getUser(request.params.userId)
    if (!user) throw new HttpError(404, 'User not found')
    const [exams, sessions] = await Promise.all([getUserExams(user.id), getUserExamSessions(user.id)])
    response.render('user.html', { user, exams, sessions, title: user.name })
  })
)

app.get(
  '/tags/:slug',
  ah(async (request, response) => {
    const tag = await getTag(request.params.slug)
    if (!tag) throw new HttpError(404, 'Tag not found')
    response.render('tag.html', { tag, title: tag.name })
  })
)

app.get(
  '/login',
  ah(async (request, response) => {
    const target = redirectPath(request.query.redirect)
    if (!isDevelopmentEnvironment()) {
      response.render('login.html', { title: 'Login', redirect: target })
      return
    }

    try {
      await authenticate(response, { email: 'root@examme.test', password: 'Root123!' })
      response.redirect(target)
    } catch (error) {
      response.status(500).render('login.html', {
        title: 'Login',
        redirect: target,
        error: error instanceof Error ? error.message : 'Development authentication failed'
      })
    }
  })
)

app.get('/register', (_request, response) => response.render('register.html', { title: 'Register' }))

async function authenticate(response: Response, credentials: { email: string; password: string }) {
  const user = await getUserCredentials(credentials.email)
  if (!user || !(await bcrypt.compare(credentials.password, user.password))) {
    throw new Error('Authentication failed')
  }
  const token = jwt.sign({ userId: user.id, type: 'access' }, 'any', { expiresIn: '100d' })
  response.cookie('authenticationToken', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })
}

app.get(
  '/:userSlug/:examSlug/:questionSlug',
  ah(async (request, response) => {
    const question = await getQuestion(
      request.params.questionSlug,
      response.locals.currentUser?.id,
      canViewUnapproved(response.locals.currentUser, 'getQuestion')
    )
    const matches =
      !!question &&
      question.exam?.slug === request.params.examSlug &&
      question.exam.userSlug === request.params.userSlug
    if (!matches) throw new HttpError(404, 'Question not found')
    response.render('question.html', { question, title: question.title })
  })
)

app.get(
  '/:userSlug/:examSlug',
  ah(async (request, response) => {
    const exam = await getExam(request.params.examSlug, canViewUnapproved(response.locals.currentUser, 'getExam'))
    const matches = !!exam && exam.slug === request.params.examSlug && exam.userSlug === request.params.userSlug
    if (!matches) throw new HttpError(404, 'Exam not found')
    response.render('exam.html', { exam, title: exam.name })
  })
)

app.get(
  '/:userSlug',
  ah(async (request, response) => {
    const user = await getUser(request.params.userSlug)
    if (!user) throw new HttpError(404, 'User not found')
    const [exams, sessions] = await Promise.all([getUserExams(user.id), getUserExamSessions(user.id)])
    response.render('user.html', { user, exams, sessions, title: user.name })
  })
)

app.use((_request, _response, next) => next(new HttpError(404, 'Page not found')))

app.use((error: unknown, request: Request, response: Response) => {
  console.error('Web request failed', error)
  const statusCode = ((error: unknown): number => {
    if (!error || typeof error !== 'object') return 500
    const candidate = error as { status?: unknown; statusCode?: unknown }
    const status = candidate.statusCode ?? candidate.status
    return typeof status === 'number' && status >= 400 && status <= 599 ? status : 500
  })(error)
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

export { app }
export const handler = serverless(app)
