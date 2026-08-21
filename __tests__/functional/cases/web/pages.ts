import { beforeAll, describe, expect, test } from '@jest/globals'
import Exam from '../../../../shared/src/entities/exam/Exam'
import ExamTag from '../../../../shared/src/entities/examTag/ExamTag'
import Question from '../../../../shared/src/entities/question/Question'
import User from '../../../../shared/src/entities/user/User'
import Permission from '../../../../shared/src/enums/Permission'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Web pages', () => {
  let user: User
  let exam: Exam
  let question: Question
  let tag: ExamTag
  let token: string

  beforeAll(async () => {
    user = await framework.fixture<User>(User, {
      name: 'Demo Learner',
      permissions: [Permission.All]
    })
    exam = await framework.fixture<Exam>(Exam, {
      name: 'Web page test exam',
      creatorId: user.id,
      ownerId: undefined
    })
    question = await framework.fixture<Question>(Question, {
      title: 'Web page test question',
      examId: exam.id,
      creatorId: user.id,
      ownerId: undefined
    })
    tag = await framework.fixture<ExamTag>(ExamTag, {
      name: 'Web page test tag',
      slug: 'web-page-test-tag'
    })
    token = (await framework.auth(user)).token
  })

  const getPage = async (path: string, authenticated = false): Promise<Response> =>
    fetch(new URL(path, framework.web), {
      headers: authenticated ? { cookie: `authenticationToken=${encodeURIComponent(token)}` } : undefined
    })

  test.each([
    ['home page', () => '/'],
    ['exams page', () => '/exams'],
    ['questions page', () => '/questions'],
    ['users page', () => '/users'],
    ['login page', () => '/login'],
    ['register page', () => '/register'],
    ['exam by id page', () => `/exams/${exam.id}`],
    ['question by id page', () => `/questions/${question.id}`],
    ['user by id page', () => `/users/${user.id}`],
    ['tag page', () => `/tags/${tag.slug}`],
    ['public user page', () => `/${user.slug}`],
    ['public exam page', () => `/${user.slug}/${exam.slug}`],
    ['public question page', () => `/${user.slug}/${exam.slug}/${question.slug}`]
  ])('%s renders successfully', async (_name, getPath) => {
    const response = await getPage(getPath())
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(body).toContain('<html')
    expect(body).not.toContain('Template render error')
  })

  test.each([
    ['new exam page', () => '/exams/new'],
    ['new question page', () => `/questions/new?exam=${exam.id}`],
    ['edit exam page', () => `/exams/${exam.id}/edit`],
    ['edit question page', () => `/questions/${question.id}/edit`],
    ['edit user page', () => `/users/${user.id}/edit`]
  ])('%s renders for an authenticated user', async (_name, getPath) => {
    const response = await getPage(getPath(), true)
    const body = await response.text()

    expect(response.status).toBe(200)
    expect(body).toContain('<html')
    expect(body).not.toContain('Template render error')
  })

  test('new exam page redirects anonymous users to login', async () => {
    const response = await fetch(new URL('/exams/new', framework.web), { redirect: 'manual' })

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toContain('/login')
  })

  test('new question page requires authentication', async () => {
    const response = await fetch(new URL(`/questions/new?exam=${exam.id}`, framework.web), { redirect: 'manual' })

    expect(response.status).toBe(401)
  })
})
