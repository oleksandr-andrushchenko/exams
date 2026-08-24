export type RouteName =
  | 'home'
  | 'exams'
  | 'questions'
  | 'users'
  | 'userEdit'
  | 'examEdit'
  | 'questionEdit'
  | 'newExam'
  | 'newQuestion'
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
  newQuestion: '/exams/:examId/questions/new',
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

export const examUrl = (
  exam: { id?: string | number; userSlug?: string; slug?: string },
  absolute = false,
  origin = ''
): string => {
  const path = exam.userSlug && exam.slug
    ? route('examProfile', { userSlug: exam.userSlug, examSlug: exam.slug })
    : route('examById', { examId: exam.id?.toString() })
  return withOrigin(path, absolute, origin)
}

export const questionUrl = (
  question: { id?: string | number; slug?: string },
  exam: { id?: string | number; userSlug?: string; slug?: string } | undefined = undefined,
  absolute = false,
  origin = ''
): string => {
  const path = question.slug && exam?.userSlug && exam.slug
    ? route('questionProfile', { userSlug: exam.userSlug, examSlug: exam.slug, questionSlug: question.slug })
    : route('questionById', { questionId: question.id?.toString() })
  return withOrigin(path, absolute, origin)
}

export const userUrl = (
  user: { id?: string | number; slug?: string },
  absolute = false,
  origin = ''
): string => {
  const path = user.slug
    ? route('userProfile', { userSlug: user.slug })
    : route('userById', { userId: user.id?.toString() })
  return withOrigin(path, absolute, origin)
}
