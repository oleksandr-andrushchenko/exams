import { describe, expect, test } from '@jest/globals'
import request from '../../httpRequest'
import User from '../../../../shared/src/entities/user/User'
import ExamSession from '../../../../shared/src/entities/examSession/ExamSession'
import ExamSessionPermission from '../../../../shared/src/enums/examSession/ExamSessionPermission'
// @ts-ignore
import { deleteExamSession } from '../../requests/examSession/deleteExamSession'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Delete examSession', () => {
  test('Unauthorized', async () => {
    const examSession = await framework.fixture<ExamSession>(ExamSession)
    const res = await request(framework.app)
      .post('/')
      .send(deleteExamSession({ examSessionId: examSession.id.toString() }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.apiError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id)', async () => {
    const user = await framework.fixture<User>(User, {
      permissions: [ExamSessionPermission.Get, ExamSessionPermission.Delete]
    })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(deleteExamSession({ examSessionId: 'invalid' }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.apiError('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, {
      permissions: [ExamSessionPermission.Get, ExamSessionPermission.Delete]
    })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app)
      .post('/')
      .send(deleteExamSession({ examSessionId: id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.apiError('NotFoundError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const examSession = await framework.fixture<ExamSession>(ExamSession)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(deleteExamSession({ examSessionId: examSession.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.apiError('ForbiddenError'))
  })
  test('Deleted (has ownership)', async () => {
    const examSession = await framework.fixture<ExamSession>(ExamSession)
    const user = await framework.load<User>(User, examSession.ownerId)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(deleteExamSession({ examSessionId: examSession.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { deleteExamSession: true } })
    expect(await framework.load<ExamSession>(ExamSession, examSession.id)).toBeNull()
  })
  test('Deleted (has permission)', async () => {
    const examSession = await framework.fixture<ExamSession>(ExamSession)
    const user = await framework.fixture<User>(User, {
      permissions: [ExamSessionPermission.Get, ExamSessionPermission.Delete]
    })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(deleteExamSession({ examSessionId: examSession.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { deleteExamSession: true } })
    expect(await framework.load<ExamSession>(ExamSession, examSession.id)).toBeNull()
  })
})
