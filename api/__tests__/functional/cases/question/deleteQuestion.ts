import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Question from '../../../../src/entities/question/Question'
import User from '../../../../src/entities/user/User'
import QuestionPermission from '../../../../src/enums/question/QuestionPermission'
// @ts-ignore
import { deleteQuestion } from '../../graphql/question/deleteQuestion'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Delete question', () => {
  test('Unauthorized', async () => {
    const question = await framework.fixture<Question>(Question)
    const res = await request(framework.app).post('/')
      .send(deleteQuestion({ questionId: question.id.toString() }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.Delete ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(deleteQuestion({ questionId: 'invalid' }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.Delete ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/')
      .send(deleteQuestion({ questionId: id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const question = await framework.fixture<Question>(Question)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(deleteQuestion({ questionId: question.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Deleted (has ownership)', async () => {
    const question = await framework.fixture<Question>(Question)
    const user = await framework.load<User>(User, question.creatorId)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(deleteQuestion({ questionId: question.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { deleteQuestion: true } })
    expect(await framework.load<Question>(Question, question.id)).toBeNull()
  })
  test('Deleted (has permission)', async () => {
    const question = await framework.fixture<Question>(Question)
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.Delete ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(deleteQuestion({ questionId: question.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { deleteQuestion: true } })
    expect(await framework.load<Question>(Question, question.id)).toBeNull()
  })
})