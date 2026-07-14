import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Question from '../../../../src/entities/question/Question'
import User from '../../../../src/entities/user/User'
import QuestionPermission from '../../../../src/enums/question/QuestionPermission'
// @ts-ignore
import { toggleQuestionApprove } from '../../graphql/question/toggleQuestionApprove'
import TestFramework from '../../TestFramework'
import Category from '../../../../src/entities/category/Category'

const framework: TestFramework = globalThis.framework

describe('Approve question', () => {
  test('Unauthorized', async () => {
    const question = await framework.fixture<Question>(Question)
    const questionId = question.id.toString()
    const res = await request(framework.app).post('/')
      .send(toggleQuestionApprove({ questionId }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid question id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.Approve ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(toggleQuestionApprove({ questionId: 'invalid' }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.Approve ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/')
      .send(toggleQuestionApprove({ questionId: id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Forbidden (no permission)', async () => {
    const user = await framework.fixture<User>(User)
    const question = await framework.fixture<Question>(Question)
    const questionId = question.id.toString()
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(toggleQuestionApprove({ questionId }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Forbidden (ownership without permission)', async () => {
    const user = await framework.fixture<User>(User)
    const question = await framework.fixture<Question>(Question, { creatorId: user.id, ownerId: user.id })
    const questionId = question.id.toString()
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(toggleQuestionApprove({ questionId }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Approved', async () => {
    await framework.clear(Question)
    const category = await framework.fixture<Category>(Category)
    await Promise.all([
      framework.fixture<Question>(Question, { categoryId: category.id, ownerId: undefined }),
      framework.fixture<Question>(Question, { categoryId: category.id, ownerId: undefined }),
      framework.fixture<Question>(Question, { categoryId: category.id }),
    ])
    const question = await framework.fixture<Question>(Question, { categoryId: category.id })
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.Approve ] })
    const token = (await framework.auth(user)).token
    const questionId = question.id.toString()
    const res = await request(framework.app).post('/')
      .send(toggleQuestionApprove({ questionId }, [ 'id', 'ownerId' ]))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { toggleQuestionApprove: { id: questionId, ownerId: null } } })

    const updatedQuestion = await framework.load<Question>(Question, question.id)
    expect(updatedQuestion).not.toHaveProperty('ownerId')

    const updatedCategory = await framework.load<Category>(Category, category.id)
    expect(updatedCategory).toHaveProperty('approvedQuestionCount')
    expect(updatedCategory.approvedQuestionCount).toEqual(3)
  })
  test('Un-approved', async () => {
    await framework.clear(Question)
    const category = await framework.fixture<Category>(Category)
    await Promise.all([
      framework.fixture<Question>(Question, { categoryId: category.id, ownerId: undefined }),
      framework.fixture<Question>(Question, { categoryId: category.id, ownerId: undefined }),
      framework.fixture<Question>(Question, { categoryId: category.id }),
    ])
    const question = await framework.fixture<Question>(Question, { categoryId: category.id, ownerId: undefined })
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.Approve ] })
    const token = (await framework.auth(user)).token
    const questionId = question.id.toString()
    const res = await request(framework.app).post('/')
      .send(toggleQuestionApprove({ questionId }, [ 'id', 'ownerId' ]))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({
      data: {
        toggleQuestionApprove: {
          id: questionId,
          ownerId: question.creatorId.toString(),
        },
      },
    })

    const updatedQuestion = await framework.load<Question>(Question, question.id)
    expect(updatedQuestion).toHaveProperty('ownerId')
    expect(updatedQuestion.ownerId.toString()).toEqual(question.creatorId.toString())

    const updatedCategory = await framework.load<Category>(Category, category.id)
    expect(updatedCategory).toHaveProperty('approvedQuestionCount')
    expect(updatedCategory.approvedQuestionCount).toEqual(2)
  })
})