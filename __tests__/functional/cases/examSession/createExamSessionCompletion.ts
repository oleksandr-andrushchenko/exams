import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import ExamSession from '../../../../api-lambda/src/entities/examSession/ExamSession'
import User from '../../../../api-lambda/src/entities/user/User'
import ExamSessionPermission from '../../../../api-lambda/src/enums/examSession/ExamSessionPermission'
// @ts-ignore
import { createExamSessionCompletion } from '../../requests/examSession/createExamSessionCompletion'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Create examSession completion', () => {
  test('Unauthorized', async () => {
    const examSession = await framework.fixture<ExamSession>(ExamSession)
    const res = await request(framework.app)
      .post('/')
      .send(createExamSessionCompletion({ examSessionId: examSession.id.toString() }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.apiError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid examSession id)', async () => {
    const user = await framework.fixture<User>(User, {
      permissions: [ExamSessionPermission.Get, ExamSessionPermission.CreateCompletion]
    })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(createExamSessionCompletion({ examSessionId: 'invalid' }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.apiError('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, {
      permissions: [ExamSessionPermission.Get, ExamSessionPermission.CreateCompletion]
    })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app)
      .post('/')
      .send(createExamSessionCompletion({ examSessionId: id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.apiError('NotFoundError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const examSession = await framework.fixture<ExamSession>(ExamSession)
    const res = await request(framework.app)
      .post('/')
      .send(createExamSessionCompletion({ examSessionId: examSession.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.apiError('ForbiddenError'))
  })
  test('Created (has ownership)', async () => {
    const examSession = await framework.fixture<ExamSession>(ExamSession)
    const user = await framework.load<User>(User, examSession.ownerId)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(createExamSessionCompletion({ examSessionId: examSession.id.toString() }, ['id', 'completedAt']))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { createExamSessionCompletion: { id: examSession.id.toString() } } })
    expect(res.body.data.createExamSessionCompletion.completedAt).toBeGreaterThan(0)
    expect((await framework.load<ExamSession>(ExamSession, examSession.id)).completedAt.getTime()).toEqual(
      res.body.data.createExamSessionCompletion.completedAt
    )
  })
  test('Created (has permission)', async () => {
    const examSession = await framework.fixture<ExamSession>(ExamSession)
    const user = await framework.fixture<User>(User, {
      permissions: [ExamSessionPermission.Get, ExamSessionPermission.CreateCompletion]
    })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(createExamSessionCompletion({ examSessionId: examSession.id.toString() }, ['id', 'completedAt']))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { createExamSessionCompletion: { id: examSession.id.toString() } } })
    expect(res.body.data.createExamSessionCompletion.completedAt).toBeGreaterThan(0)
    expect((await framework.load<ExamSession>(ExamSession, examSession.id)).completedAt.getTime()).toEqual(
      res.body.data.createExamSessionCompletion.completedAt
    )
  })
})
