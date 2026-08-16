export type RouteName =
  | 'home'
  | 'exams'
  | 'questions'
  | 'users'
  | 'userEdit'
  | 'examEdit'
  | 'questionEdit'
  | 'newExam'
  | 'examById'
  | 'questionById'
  | 'userById'
  | 'tagBySlug'
  | 'login'
  | 'register'
  | 'logout'
  | 'userProfile'
  | 'examProfile'
  | 'questionProfile'

const definitions: Record<RouteName, string> = {
  home: '/',
  exams: '/exams',
  questions: '/questions',
  users: '/users',
  userEdit: '/users/:userId/edit',
  examEdit: '/exams/:examId/edit',
  questionEdit: '/questions/:questionId/edit',
  newExam: '/exams/new',
  examById: '/exams/:examId',
  questionById: '/questions/:questionId',
  userById: '/users/:userId',
  tagBySlug: '/tags/:slug',
  login: '/login',
  register: '/register',
  logout: '/logout',
  userProfile: '/:userSlug',
  examProfile: '/:userSlug/:examSlug',
  questionProfile: '/:userSlug/:examSlug/:questionSlug'
}

export const route = (
  name: RouteName,
  params: Record<string, string | number | undefined> = {},
  query: Record<string, string | number | undefined> = {}
): string => {
  const path = definitions[name].replace(/:([A-Za-z0-9_]+)/g, (_match, key: string) => {
    const value = params[key]
    if (value === undefined || value === null) throw new Error('Missing route parameter: ' + key)
    return encodeURIComponent(String(value))
  })
  const queryString = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => encodeURIComponent(key) + '=' + encodeURIComponent(String(value)))
    .join('&')
  return queryString ? path + '?' + queryString : path
}

const withOrigin = (path: string, absolute: boolean, origin: string): string =>
  absolute ? new URL(path, origin).toString() : path

export const url = (
  name: RouteName,
  params: Record<string, string | number | undefined> = {},
  query: Record<string, string | number | undefined> = {},
  absolute = false,
  origin = ''
): string => withOrigin(route(name, params, query), absolute, origin)

export const staticUrl = (asset: string, absolute = false, origin = ''): string =>
  withOrigin('/static/' + asset.replace(/^\//, ''), absolute, origin)

export const examUrl = (exam: { userSlug?: string; slug?: string }, absolute = false, origin = ''): string =>
  withOrigin(route('examProfile', { userSlug: exam.userSlug, examSlug: exam.slug }), absolute, origin)

export const questionUrl = (
  question: { slug?: string },
  exam: { userSlug?: string; slug?: string } | undefined = undefined,
  absolute = false,
  origin = ''
): string =>
  withOrigin(
    route('questionProfile', { userSlug: exam?.userSlug, examSlug: exam?.slug, questionSlug: question.slug }),
    absolute,
    origin
  )

export const userUrl = (user: { slug?: string } | string, absolute = false, origin = ''): string =>
  withOrigin(route('userProfile', { userSlug: typeof user === 'string' ? user : user.slug }), absolute, origin)
