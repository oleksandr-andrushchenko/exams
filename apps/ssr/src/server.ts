import express, { type Request, type Response } from 'express'
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
  getUserExams,
  getUserExamSessions,
  getUserList
} from './data'

const app = express()
const templateDir = path.resolve(__dirname, '../templates')
const sharedTemplateDir = path.resolve(__dirname, '../../../shared/templates')
const publicDir = path.resolve(__dirname, '../public')

nunjucks.configure([templateDir, sharedTemplateDir], {autoescape: true, express: app, noCache: process.env.NODE_ENV !== 'production'})
app.use(express.urlencoded({extended: true}))
app.use('/static', express.static(publicDir, {maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0}))
app.use((request, response, next) => {
  response.locals.siteName = 'ExamMe'
  response.locals.siteDescription = 'Practice exams and explore questions.'
  response.locals.requestPath = request.path
  response.locals.query = request.query
  next()
})
app.use(async (request, response, next) => {
  const token = request.headers.cookie
    ?.split(';')
    .map(cookie => cookie.trim())
    .find(cookie => cookie.startsWith('authenticationToken='))
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
  order: request.query.order === 'asc' ? 'asc' : 'desc',
})

app.get('/', async (_request, response, next) => {
  try {
    response.render('home.html', {data: await getHomeData(8), title: 'Home'})
  } catch (error) {
    next(error)
  }
})
app.get('/exams', async (request, response, next) => {
  try {
    response.render('exams.html', {
      page: await getExamList(queryFilters(request)),
      filters: queryFilters(request),
      title: 'Exams'
    })
  } catch (error) {
    next(error)
  }
})
app.get('/questions', async (request, response, next) => {
  try {
    response.render('questions.html', {
      page: await getQuestionList(queryFilters(request)),
      filters: queryFilters(request),
      title: 'Questions'
    })
  } catch (error) {
    next(error)
  }
})
app.get('/users', async (request, response, next) => {
  try {
    response.render('users.html', {
      page: await getUserList(queryFilters(request)),
      filters: queryFilters(request),
      title: 'Users'
    })
  } catch (error) {
    next(error)
  }
})

async function submitRating(request: Request, response: Response, id: string) {
  const mark = Number(request.body.mark)
  const token = request.headers.cookie
    ?.split(';')
    .map(cookie => cookie.trim())
    .find(cookie => cookie.startsWith('authenticationToken='))
    ?.slice('authenticationToken='.length)
  const target = '/questions/' + id

  const wantsJson = request.headers.accept?.includes('application/json')
  if (!Number.isInteger(mark) || mark < 0 || mark > 5 || !token) {
    if (wantsJson) { response.status(400).json({ ok: false, error: 'Invalid rating request' }); return }
    response.redirect(target + '?ratingError=1')
    return
  }

  const field = 'questionId'
  const mutation = 'rateQuestion'
  const result = await fetch(process.env.GRAPHQL_URL || 'http://localhost:8080/graphql', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
    body: JSON.stringify({
      query: 'mutation Rate($id: ID!, $mark: Int!) { ' + mutation + '(' + field + ': $id, mark: $mark) { id rating { html averageMark markCount } } }',
      variables: { id, mark },
    }),
  })
  const payload = await result.json() as { errors?: unknown[] }
  if (wantsJson) {
    if (!result.ok || payload.errors?.length) { response.status(400).json({ ok: false, error: payload.errors?.[0] || 'Unable to save rating' }); return }
    response.json({ ok: true, html: (payload as any).data?.rateQuestion?.rating?.html })
    return
  }
  response.redirect(target + (payload.errors?.length ? '?ratingError=1' : ''))
}

app.post('/questions/:questionId/rating', (request, response, next) => {
  submitRating(request, response, request.params.questionId).catch(next)
})

app.get('/exams/:examId', async (request, response, next) => {
  try {
    const exam = await getExam(request.params.examId);
    response.status(exam ? 200 : 404).render('exam.html', {exam, title: exam?.name || 'Exam not found'})
  } catch (error) {
    next(error)
  }
})
app.get('/questions/:questionId', async (request, response, next) => {
  try {
    const question = await getQuestion(request.params.questionId, response.locals.currentUser?.id);
    response.status(question ? 200 : 404).render('question.html', {
      question,
      title: question?.title || 'Question not found'
    })
  } catch (error) {
    next(error)
  }
})
app.get('/users/:userId', async (request, response, next) => {
  try {
    const user = await getUser(request.params.userId)
    const [exams, sessions] = user ? await Promise.all([getUserExams(request.params.userId), getUserExamSessions(request.params.userId)]) : [undefined, []]
    response.status(user ? 200 : 404).render('user.html', {user, exams, sessions, title: user?.name || 'User not found'})
  } catch (error) {
    next(error)
  }
})
app.get('/tags/:slug', async (request, response, next) => {
  try {
    const tag = await getTag(request.params.slug);
    response.status(tag ? 200 : 404).render('tag.html', {tag, title: tag?.name || 'Tag not found'})
  } catch (error) {
    next(error)
  }
})
app.get('/login', (_request, response) => response.render('login.html', {title: 'Login'}))
app.get('/register', (_request, response) => response.render('register.html', {title: 'Register'}))

async function authenticate(response: Response, credentials: { email: string; password: string }, register: boolean) {
  const query = register
    ? 'mutation Register($createMe: CreateMe!, $credentials: Credentials!) { createMe(createMe: $createMe) { id } createAuthenticationToken(credentials: $credentials) { token } }'
    : 'mutation Login($email: String!, $password: String!) { createAuthenticationToken(credentials: { email: $email, password: $password }) { token } }'
  const variables = register
    ? {createMe: credentials, credentials}
    : credentials
  const result = await fetch(process.env.GRAPHQL_URL || 'http://localhost:8080/graphql', {
    method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify({query, variables}),
  })
  const payload = await result.json() as {
    data?: { createAuthenticationToken?: { token?: string } };
    errors?: Array<{ message?: string }>
  }
  if (!result.ok || payload.errors?.length || !payload.data?.createAuthenticationToken?.token) {
    throw new Error(payload.errors?.[0]?.message || 'Authentication failed')
  }
  response.cookie('authenticationToken', payload.data.createAuthenticationToken.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })
}

app.post('/login', async (request, response) => {
  try {
    await authenticate(response, {email: request.body.email, password: request.body.password}, false);
    response.redirect('/')
  } catch (error) {
    response.status(401).render('login.html', {
      title: 'Login',
      error: error instanceof Error ? error.message : 'Authentication failed'
    })
  }
})
app.post('/logout', (_request, response) => {
  response.clearCookie('authenticationToken')
  response.redirect('/')
})
app.post('/register', async (request, response) => {
  try {
    await authenticate(response, {email: request.body.email, password: request.body.password}, true);
    response.redirect('/')
  } catch (error) {
    response.status(400).render('register.html', {
      title: 'Register',
      error: error instanceof Error ? error.message : 'Registration failed'
    })
  }
})
app.use((error: Error, _request: Request, response: Response, _next: express.NextFunction) => {
  console.error('SSR request failed', error)
  response.status(500).render('error.html', {
    title: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? undefined : error.message
  })
})

export { app }
export const handler = serverless(app)
