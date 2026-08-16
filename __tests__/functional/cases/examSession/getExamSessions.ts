import { beforeAll, describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../api-lambda/src/entities/user/User'
import ExamSession from '../../../../api-lambda/src/entities/examSession/ExamSession'
import Exam from '../../../../api-lambda/src/entities/exam/Exam'
import ExamSessionPermission from '../../../../api-lambda/src/enums/examSession/ExamSessionPermission'
// @ts-ignore
import { getExamSessions } from '../../requests/examSession/getExamSessions'
import GetExamSessions from '../../../../api-lambda/src/schema/examSession/GetExamSessions'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

let validationToken: string

beforeAll(async () => {
  const user = await framework.fixture<User>(User)
  validationToken = (await framework.auth(user)).token
})

describe('Get examSessions', () => {
  test('Unauthorized', async () => {
    const res = await request(framework.app).post('/').send(getExamSessions())

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.apiError('AuthorizationRequiredError'))
  })
  test.each([
    { case: 'invalid exam type', query: { examId: 1 } },
    { case: 'invalid exam', query: { examId: 'any' } },
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
      .send(getExamSessions(query as GetExamSessions))
      .auth(validationToken, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.apiError('BadRequestError'))
  })
  test('Empty', async () => {
    await framework.clear(ExamSession)
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/').send(getExamSessions()).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toEqual({ data: { examSessions: [] } })
  })
  test('No filter (ownership)', async () => {
    await framework.clear(ExamSession)
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const ownerId = user.id
    const examSessionOwnOptions = { ownerId }
    const examSessions = (
      await Promise.all([
        framework.fixture<ExamSession>(ExamSession, examSessionOwnOptions),
        framework.fixture<ExamSession>(ExamSession),
        framework.fixture<ExamSession>(ExamSession, examSessionOwnOptions)
      ])
    ).sort((a: ExamSession, b: ExamSession) => a.id.toString().localeCompare(b.id.toString()))

    const fields = ['id', 'examId', 'questionNumber', 'completedAt', 'createdAt', 'updatedAt', 'ownerId']
    const res = await request(framework.app).post('/').send(getExamSessions({}, fields)).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)

    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('examSessions')

    const ownExamSessions = examSessions.filter((examSession) => examSession.ownerId.toString() === ownerId.toString())
    expect(res.body.data.examSessions).toHaveLength(ownExamSessions.length)

    const resExamSessions = res.body.data.examSessions.sort((a, b) => a.id.localeCompare(b.id))

    for (const index in ownExamSessions) {
      expect(resExamSessions[index]).toMatchObject({
        id: ownExamSessions[index].id.toString(),
        examId: ownExamSessions[index].examId.toString(),
        questionNumber: ownExamSessions[index].questionNumber,
        completedAt: ownExamSessions[index].completedAt?.getTime() ?? null,
        ownerId: ownExamSessions[index].ownerId.toString(),
        createdAt: ownExamSessions[index].createdAt.getTime(),
        updatedAt: ownExamSessions[index].updatedAt?.getTime() ?? null
      })
      expect(resExamSessions[index]).not.toHaveProperty(['questions', 'creatorId', 'deletedAt'])
    }
  })
  test('Exam filter (ownership)', async () => {
    await framework.clear(ExamSession)
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const ownerId = user.id
    const examSessionOwnOptions = { ownerId }
    const examSessionExamOptions = { examId: exam.id }
    const examSessions = (
      await Promise.all([
        framework.fixture<ExamSession>(ExamSession, examSessionOwnOptions),
        framework.fixture<ExamSession>(ExamSession, examSessionExamOptions),
        framework.fixture<ExamSession>(ExamSession, { ...examSessionOwnOptions, ...examSessionExamOptions })
      ])
    ).sort((a: ExamSession, b: ExamSession) => a.id.toString().localeCompare(b.id.toString()))

    const fields = ['id', 'examId', 'questionNumber', 'completedAt', 'createdAt', 'updatedAt', 'ownerId']
    const res = await request(framework.app)
      .post('/')
      .send(getExamSessions({ examId: exam.id.toString() }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)

    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('examSessions')

    const ownExamExamSessions = examSessions
      .filter((examSession) => examSession.ownerId.toString() === ownerId.toString())
      .filter((examSession) => examSession.examId.toString() === exam.id.toString())
    expect(res.body.data.examSessions).toHaveLength(ownExamExamSessions.length)

    const resExamSessions = res.body.data.examSessions.sort((a, b) => a.id.localeCompare(b.id))

    for (const index in ownExamExamSessions) {
      expect(resExamSessions[index]).toMatchObject({
        id: ownExamExamSessions[index].id.toString(),
        examId: ownExamExamSessions[index].examId.toString(),
        questionNumber: ownExamExamSessions[index].questionNumber,
        completedAt: ownExamExamSessions[index].completedAt?.getTime() ?? null,
        ownerId: ownExamExamSessions[index].ownerId.toString(),
        createdAt: ownExamExamSessions[index].createdAt.getTime(),
        updatedAt: ownExamExamSessions[index].updatedAt?.getTime() ?? null
      })
      expect(resExamSessions[index]).not.toHaveProperty(['questions', 'creatorId', 'deletedAt'])
    }
  })
  test('No filter (permission)', async () => {
    await framework.clear(ExamSession)
    const user = await framework.fixture<User>(User, { permissions: [ExamSessionPermission.Get] })
    const token = (await framework.auth(user)).token
    const ownerId = user.id
    const examSessionOwnOptions = { ownerId }
    const examSessions = (
      await Promise.all([
        framework.fixture<ExamSession>(ExamSession),
        framework.fixture<ExamSession>(ExamSession, examSessionOwnOptions),
        framework.fixture<ExamSession>(ExamSession)
      ])
    ).sort((a: ExamSession, b: ExamSession) => a.id.toString().localeCompare(b.id.toString()))

    const fields = ['id', 'examId', 'questionNumber', 'completedAt', 'createdAt', 'updatedAt', 'ownerId']
    const res = await request(framework.app).post('/').send(getExamSessions({}, fields)).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)

    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('examSessions')

    expect(res.body.data.examSessions).toHaveLength(examSessions.length)

    const resExamSessions = res.body.data.examSessions.sort((a, b) => a.id.localeCompare(b.id))

    for (const index in examSessions) {
      expect(resExamSessions[index]).toMatchObject({
        id: examSessions[index].id.toString(),
        examId: examSessions[index].examId.toString(),
        questionNumber: examSessions[index].questionNumber,
        completedAt: examSessions[index].completedAt?.getTime() ?? null,
        ownerId: examSessions[index].ownerId.toString(),
        createdAt: examSessions[index].createdAt.getTime(),
        updatedAt: examSessions[index].updatedAt?.getTime() ?? null
      })
      expect(resExamSessions[index]).not.toHaveProperty(['questions', 'creatorId', 'deletedAt'])
    }
  })
  test('Exam filter (permission)', async () => {
    await framework.clear(ExamSession)
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.fixture<User>(User, { permissions: [ExamSessionPermission.Get] })
    const token = (await framework.auth(user)).token
    const ownerId = user.id
    const examSessionOwnOptions = { ownerId }
    const examSessionExamOptions = { examId: exam.id }
    const examSessions = (
      await Promise.all([
        framework.fixture<ExamSession>(ExamSession),
        framework.fixture<ExamSession>(ExamSession, examSessionOwnOptions),
        framework.fixture<ExamSession>(ExamSession, { ...examSessionOwnOptions, ...examSessionExamOptions })
      ])
    ).sort((a: ExamSession, b: ExamSession) => a.id.toString().localeCompare(b.id.toString()))

    const fields = ['id', 'examId', 'questionNumber', 'completedAt', 'createdAt', 'updatedAt', 'ownerId']
    const res = await request(framework.app)
      .post('/')
      .send(getExamSessions({ examId: exam.id.toString() }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)

    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('examSessions')

    const examExamSessions = examSessions.filter((examSession) => examSession.examId.toString() === exam.id.toString())
    expect(res.body.data.examSessions).toHaveLength(examExamSessions.length)

    const resExamSessions = res.body.data.examSessions.sort((a, b) => a.id.localeCompare(b.id))

    for (const index in examExamSessions) {
      expect(resExamSessions[index]).toMatchObject({
        id: examExamSessions[index].id.toString(),
        examId: examExamSessions[index].examId.toString(),
        questionNumber: examExamSessions[index].questionNumber,
        completedAt: examExamSessions[index].completedAt?.getTime() ?? null,
        ownerId: examExamSessions[index].ownerId.toString(),
        createdAt: examExamSessions[index].createdAt.getTime(),
        updatedAt: examExamSessions[index].updatedAt?.getTime() ?? null
      })
      expect(resExamSessions[index]).not.toHaveProperty(['questions', 'creatorId', 'deletedAt'])
    }
  })
  test('User profile sessions', async () => {
    await framework.clear(ExamSession)
    const user = await framework.fixture<User>(User)
    const exam = await framework.fixture<Exam>(Exam)
    const session = await framework.fixture<ExamSession>(ExamSession, { examId: exam.id, ownerId: user.id })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send({
        method: 'GET',
        path: '/exam-sessions',
        query: { userId: user.id.toString(), meta: true },
        field: 'examSessions'
      })
      .auth(token, { type: 'bearer' })

    expect(res.body.data.examSessions.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: session.id.toString(),
          examId: exam.id.toString()
        })
      ])
    )
  })
})
