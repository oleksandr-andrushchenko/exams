import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Category from '../../../../src/entities/category/Category'
import Question from '../../../../src/entities/question/Question'
// @ts-ignore
import { getQuestions } from '../../graphql/question/getQuestions'
import GetQuestions from '../../../../src/schema/question/GetQuestions'
import TestFramework from '../../TestFramework'
import User from '../../../../src/entities/user/User'
import QuestionType from '../../../../src/entities/question/QuestionType'
import QuestionChoice from '../../../../src/entities/question/QuestionChoice'

const framework: TestFramework = globalThis.framework

describe('Get questions', () => {
  test.each([
    { case: 'invalid category', query: { category: 'any' } },
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
    { case: 'not allowed order', query: { order: 'any' } },
  ])('Bad request ($case)', async ({ query }) => {
    const res = await request(framework.app).post('/').send(getQuestions(query as GetQuestions))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Empty by category', async () => {
    await framework.clear(Question)
    const category = await framework.fixture<Category>(Category)
    const res = await request(framework.app).post('/')
      .send(getQuestions({ category: category.id.toString() }))

    expect(res.status).toEqual(200)
    expect(res.body.data.questions).toEqual([])
  })
  test('Not empty by category (ownership)', async () => {
    await framework.clear()
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const category = await framework.fixture<Category>(Category, { creatorId: user.id })
    const questions = await Promise.all([
      framework.fixture<Question>(Question, { categoryId: category.id, creatorId: user.id }),
      framework.fixture<Question>(Question, { categoryId: category.id, creatorId: user.id }),
    ])
    const fields = [
      'id',
      'title',
      'categoryId',
      'type',
      'difficulty',
      'choices {title correct explanation}',
    ]
    const res = await request(framework.app).post('/')
      .send(getQuestions({ category: category.id.toString() }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body.data.questions).toHaveLength(questions.length)

    const body = res.body.data.questions.sort((a: Question, b: Question) => a.title.localeCompare(b.title))
    questions
      .sort((a: Question, b: Question) => a.title.localeCompare(b.title))
      .forEach((question: Question, index: number) => {
        expect(body[index]).toMatchObject({
          categoryId: question.categoryId.toString(),
          type: question.type,
          difficulty: question.difficulty,
          title: question.title,
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