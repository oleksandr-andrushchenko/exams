import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../apps/graphql/src/server/entities/user/User'
import ExamSession from '../../../../apps/graphql/src/server/entities/examSession/ExamSession'
import Exam from '../../../../apps/graphql/src/server/entities/exam/Exam'
import { ObjectId } from 'bson'
import ExamSessionPermission from '../../../../apps/graphql/src/server/enums/examSession/ExamSessionPermission'
// @ts-ignore
import { createExamSession } from '../../graphql/examSession/createExamSession'
import CreateExamSession from '../../../../apps/graphql/src/server/schema/examSession/CreateExamSession'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Create examSession', () => {
  test('Unauthorized', async () => {
    const exam = await framework.fixture<Exam>(Exam, { ownerId: null })
    const res = await request(framework.app)
      .post('/')
      .send(createExamSession({ createExamSession: { examId: exam.id.toString() } }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (empty body)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ExamSessionPermission.Create] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(createExamSession({ createExamSession: {} as CreateExamSession }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User, { permissions: [] })
    const token = (await framework.auth(user)).token
    const exam = await framework.fixture<Exam>(Exam, { ownerId: null })
    const res = await request(framework.app)
      .post('/')
      .send(createExamSession({ createExamSession: { examId: exam.id.toString() } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Conflict (not approved exam)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ExamSessionPermission.Create] })
    const token = (await framework.auth(user)).token
    const exam = await framework.fixture<Exam>(Exam)
    const res = await request(framework.app)
      .post('/')
      .send(createExamSession({ createExamSession: { examId: exam.id.toString() } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ConflictError'))
  })
  test('Conflict (not approved questions)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ExamSessionPermission.Create] })
    const token = (await framework.auth(user)).token
    const exam = await framework.fixture<Exam>(Exam, { approvedQuestionCount: 0, ownerId: null })
    const res = await request(framework.app)
      .post('/')
      .send(createExamSession({ createExamSession: { examId: exam.id.toString() } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ConflictError'))
  })
  test('Conflict (examSession taken)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ExamSessionPermission.Create] })
    const token = (await framework.auth(user)).token
    const exam = await framework.fixture<Exam>(Exam, { approvedQuestionCount: 1, ownerId: null })
    const examSession = await framework.fixture<ExamSession>(ExamSession, {
      examId: exam.id,
      completed: false,
      ownerId: user.id
    })
    const res = await request(framework.app)
      .post('/')
      .send(createExamSession({ createExamSession: { examId: examSession.examId.toString() } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ConflictError'))
  })
  test('Created', async () => {
    await framework.clear(ExamSession)
    const user = await framework.fixture<User>(User, { permissions: [ExamSessionPermission.Create] })
    const token = (await framework.auth(user)).token
    const exam = await framework.fixture<Exam>(Exam, { approvedQuestionCount: 1, ownerId: null })
    const create = { examId: exam.id.toString() }
    const fields = [
      'id',
      'examId',
      'questionNumber',
      'completedAt',
      'ownerId',
      'questionCount',
      'answeredQuestionCount',
      'createdAt',
      'updatedAt'
    ]
    const now = Date.now()
    const res = await request(framework.app)
      .post('/')
      .send(createExamSession({ createExamSession: create }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { createExamSession: create } })
    expect(res.body.data.createExamSession).toHaveProperty('id')

    const id = new ObjectId(res.body.data.createExamSession.id)
    const createdExamSession = await framework.load<ExamSession>(ExamSession, id)
    expect({ ...createdExamSession, ...{ examId: createdExamSession.examId.toString() } }).toMatchObject(create)
    expect(res.body.data.createExamSession).toEqual({
      id: createdExamSession.id.toString(),
      examId: createdExamSession.examId.toString(),
      questionNumber: createdExamSession.questionNumber,
      completedAt: null,
      ownerId: createdExamSession.ownerId.toString(),
      questionCount: createdExamSession.questionCount(),
      answeredQuestionCount: createdExamSession.answeredQuestionCount(),
      createdAt: createdExamSession.createdAt.getTime(),
      updatedAt: null
    })
    expect(createdExamSession.createdAt.getTime()).toBeGreaterThanOrEqual(now)
    expect(res.body.data.createExamSession).not.toHaveProperty(['creatorId', 'deletedAt'])
  })
})
