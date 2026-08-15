import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../api-lambda/src/server/entities/user/User'
import ExamSession from '../../../../api-lambda/src/server/entities/examSession/ExamSession'
import Exam from '../../../../api-lambda/src/server/entities/exam/Exam'
// @ts-ignore
import { getCurrentExamSessions } from '../../graphql/examSession/getCurrentExamSessions'
import TestFramework from '../../TestFramework'
import GetCurrentExamSessions from '../../../../api-lambda/src/server/schema/examSession/GetCurrentExamSessions'

const framework: TestFramework = globalThis.framework

describe('Get current examSessions', () => {
  test('Unauthorized', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const res = await request(framework.app)
      .post('/')
      .send(getCurrentExamSessions({ examIds: [exam.id.toString()] }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test.each([
    { case: 'empty body', query: {} },
    { case: 'exam ids is null', query: { examIds: null } },
    { case: 'exam ids is number', query: { examIds: 1 } },
    { case: 'exam ids is empty array', query: { examIds: [] } },
    { case: 'exam ids with null', query: { examIds: [null] } },
    { case: 'exam ids with number', query: { examIds: [1] } },
    { case: 'exam ids with invalid id', query: { examIds: ['any'] } }
  ])('Bad request ($case)', async ({ query }) => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(getCurrentExamSessions(query as GetCurrentExamSessions))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Empty', async () => {
    await framework.clear(ExamSession)
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const exam = await framework.fixture<Exam>(Exam)
    const res = await request(framework.app)
      .post('/')
      .send(getCurrentExamSessions({ examIds: [exam.id.toString()] }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toEqual({ data: { currentExamSessions: [] } })
  })
  test('Non-empty', async () => {
    await framework.clear(ExamSession)
    const exams = await Promise.all([
      framework.fixture<Exam>(Exam),
      framework.fixture<Exam>(Exam),
      framework.fixture<Exam>(Exam)
    ])
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const examSessions = (
      await Promise.all([
        framework.fixture<ExamSession>(ExamSession, { examId: exams[0].id, ownerId: user.id, completed: false }),
        framework.fixture<ExamSession>(ExamSession, { examId: exams[1].id, ownerId: user.id, completed: true }),
        framework.fixture<ExamSession>(ExamSession, { examId: exams[2].id, ownerId: user.id, completed: false })
      ])
    ).sort((a, b) => a.id.toString().localeCompare(b.id.toString()))

    const fields = ['id', 'examId', 'questionNumber', 'completedAt', 'createdAt', 'updatedAt', 'ownerId']
    const res = await request(framework.app)
      .post('/')
      .send(getCurrentExamSessions({ examIds: exams.map((exam) => exam.id.toString()) }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)

    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('currentExamSessions')

    const currentExamSessions = examSessions.filter((examSession) => !examSession.completedAt)
    expect(res.body.data.currentExamSessions).toHaveLength(currentExamSessions.length)

    const resExamSessions = res.body.data.currentExamSessions.sort((a, b) => a.id.localeCompare(b.id))

    for (const index in currentExamSessions) {
      expect(resExamSessions[index]).toMatchObject({
        id: currentExamSessions[index].id.toString(),
        examId: currentExamSessions[index].examId.toString(),
        questionNumber: currentExamSessions[index].questionNumber,
        completedAt: currentExamSessions[index].completedAt?.getTime() ?? null,
        ownerId: currentExamSessions[index].ownerId.toString(),
        createdAt: currentExamSessions[index].createdAt.getTime(),
        updatedAt: currentExamSessions[index].updatedAt?.getTime() ?? null
      })
      expect(resExamSessions[index]).not.toHaveProperty(['questions', 'creatorId', 'deletedAt'])
    }
  })
})
