import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Question from '../../../../src/entities/question/Question'
// @ts-ignore
import { getQuestion } from '../../graphql/question/getQuestion'
import TestFramework from '../../TestFramework'
import User from '../../../../src/entities/user/User'
import QuestionType from '../../../../src/entities/question/QuestionType'
import QuestionChoice from '../../../../src/entities/question/QuestionChoice'

const framework: TestFramework = globalThis.framework

describe('Get question', () => {
  test('Not found (question)', async () => {
    const questionId = await framework.fakeId()
    const res = await request(framework.app).post('/').send(getQuestion({ questionId: questionId.toString() }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Bad request (invalid id)', async () => {
    const res = await request(framework.app).post('/').send(getQuestion({ questionId: 'invalid' }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Found (ownership)', async () => {
    const question = await framework.fixture<Question>(Question)
    const user = await framework.load<User>(User, question.creatorId)
    const token = (await framework.auth(user)).token
    const fields = [
      'id',
      'categoryId',
      'type',
      'difficulty',
      'title',
      'choices {title correct explanation}',
      'rating {markCount averageMark}',
      'ownerId',
      'createdAt',
      'updatedAt',
    ]
    const res = await request(framework.app).post('/')
      .send(getQuestion({ questionId: question.id.toString() }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({
      data: {
        question: {
          id: question.id.toString(),
          categoryId: question.categoryId.toString(),
          type: question.type,
          difficulty: question.difficulty,
          title: question.title,
          rating: question.rating ?? null,
          ownerId: question.ownerId.toString(),
          createdAt: question.createdAt.getTime(),
          updatedAt: question.updatedAt?.getTime() ?? null,
        },
      },
    })

    if (question.type === QuestionType.CHOICE) {
      expect(res.body.data.question).toHaveProperty('choices')
      question.choices.forEach((choice: QuestionChoice, index: number) => {
        expect(res.body.data.question.choices[index]).toMatchObject(Object.assign({}, choice) as Record<string, any>)
      })
    }

    expect(res.body.data.question).not.toHaveProperty([ 'creatorId', 'deletedAt' ])
  })
})