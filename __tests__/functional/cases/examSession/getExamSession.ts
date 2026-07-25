import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import ExamSession from '../../../../apps/graphql/src/server/entities/examSession/ExamSession'
import User from '../../../../apps/graphql/src/server/entities/user/User'
import ExamSessionPermission from '../../../../apps/graphql/src/server/enums/examSession/ExamSessionPermission'
// @ts-ignore
import { getExamSession } from '../../graphql/examSession/getExamSession'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Get examSession', () => {
  test('Unauthorized', async () => {
    const examSession = await framework.fixture<ExamSession>(ExamSession)
    const res = await request(framework.app).post('/')
      .send(getExamSession({ examSessionId: examSession.id.toString() }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamSessionPermission.Get ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(getExamSession({ examSessionId: 'invalid' }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamSessionPermission.Get ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/')
      .send(getExamSession({ examSessionId: id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const examSession = await framework.fixture<ExamSession>(ExamSession)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(getExamSession({ examSessionId: examSession.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Found (ownership)', async () => {
    const examSession = await framework.fixture<ExamSession>(ExamSession)
    const user = await framework.load<User>(User, examSession.ownerId)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(getExamSession({ examSessionId: examSession.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { examSession: { id: examSession.id.toString() } } })
  })
  test('Found (permission)', async () => {
    const examSession = await framework.fixture<ExamSession>(ExamSession)
    const user = await framework.fixture<User>(User, { permissions: [ ExamSessionPermission.Get ] })
    const token = (await framework.auth(user)).token
    const fields = [
      'id',
      'examId',
      'questionNumber',
      'completedAt',
      'ownerId',
      'questionCount',
      'answeredQuestionCount',
      'createdAt',
      'updatedAt',
    ]
    const res = await request(framework.app).post('/')
      .send(getExamSession({ examSessionId: examSession.id.toString() }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({
      data: {
        examSession: {
          id: examSession.id.toString(),
          examId: examSession.examId.toString(),
          questionNumber: examSession.questionNumber,
          completedAt: examSession.completedAt?.getTime() ?? null,
          ownerId: examSession.ownerId.toString(),
          questionCount: examSession.questionCount(),
          answeredQuestionCount: examSession.answeredQuestionCount(),
          createdAt: examSession.createdAt.getTime(),
          updatedAt: examSession.updatedAt?.getTime() ?? null,
        },
      },
    })
    expect(res.body.data.examSession).not.toHaveProperty([ 'questions', 'correctAnswerCount', 'creatorId', 'deletedAt' ])
  })
})