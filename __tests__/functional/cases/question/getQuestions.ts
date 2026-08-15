import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Exam from '../../../../api-lambda/src/server/entities/exam/Exam'
import Question from '../../../../api-lambda/src/server/entities/question/Question'
// @ts-ignore
import { getQuestions } from '../../graphql/question/getQuestions'
import GetQuestions from '../../../../api-lambda/src/server/schema/question/GetQuestions'
import TestFramework from '../../TestFramework'
import User from '../../../../api-lambda/src/server/entities/user/User'
import QuestionType from '../../../../api-lambda/src/server/entities/question/QuestionType'
import QuestionChoice from '../../../../api-lambda/src/server/entities/question/QuestionChoice'

const framework: TestFramework = globalThis.framework

describe('Get questions', () => {
  test.each([
    { case: 'invalid exam', query: { exam: 'any' } },
    { case: 'invalid subscription', query: { subscription: 'any' } },
    { case: 'invalid approved', query: { approved: 'any' } },
    { case: 'invalid difficulty', query: { difficulty: 'any' } },
    { case: 'invalid type', query: { type: 'any' } },
    { case: 'invalid cursor type', query: { cursor: 1 } },
    { case: 'not allowed cursor', query: { cursor: 'name' } },
    { case: 'invalid size type', query: { size: 'any' } },
    { case: 'negative size', query: { size: -1 } },
    { case: 'zero size', query: { size: 0 } },
    { case: 'size greater them max', query: { size: 1000 } },
    { case: 'invalid order type', query: { order: 1 } },
    { case: 'not allowed order', query: { order: 'any' } }
  ])('Bad request ($case)', async ({ query }) => {
    const res = await request(framework.app)
      .post('/')
      .send(getQuestions(query as GetQuestions))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Empty by exam', async () => {
    await framework.clear(Question)
    const exam = await framework.fixture<Exam>(Exam)
    const res = await request(framework.app)
      .post('/')
      .send(getQuestions({ exam: exam.id.toString() }))

    expect(res.status).toEqual(200)
    expect(res.body.data.questions).toEqual([])
  })
  test('Not empty by exam (ownership)', async () => {
    await framework.clear(Question)
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const exam = await framework.fixture<Exam>(Exam, { creatorId: user.id })
    const questions = await Promise.all([
      framework.fixture<Question>(Question, { examId: exam.id, creatorId: user.id }),
      framework.fixture<Question>(Question, { examId: exam.id, creatorId: user.id })
    ])
    const fields = ['id', 'title', 'examId', 'type', 'difficulty', 'choices {title correct explanation}']
    const res = await request(framework.app)
      .post('/')
      .send(getQuestions({ exam: exam.id.toString() }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body.data.questions).toHaveLength(questions.length)

    const body = res.body.data.questions.sort((a: Question, b: Question) => a.title.localeCompare(b.title))
    questions
      .sort((a: Question, b: Question) => a.title.localeCompare(b.title))
      .forEach((question: Question, index: number) => {
        expect(body[index]).toMatchObject({
          examId: question.examId.toString(),
          type: question.type,
          difficulty: question.difficulty,
          title: question.title
        })

        if (question.type === QuestionType.CHOICE) {
          expect(body[index]).toHaveProperty('choices')
          question.choices.forEach((choice: QuestionChoice, index2: number) => {
            expect(body[index].choices[index2]).toMatchObject(Object.assign({}, choice) as Record<string, any>)
          })
        }
      })
  })
})
