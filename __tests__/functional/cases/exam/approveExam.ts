import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Exam from '../../../../api-lambda/src/entities/exam/Exam'
import User from '../../../../api-lambda/src/entities/user/User'
import ExamPermission from '../../../../api-lambda/src/enums/exam/ExamPermission'
// @ts-ignore
import { toggleExamApprove } from '../../requests/exam/toggleExamApprove'
import TestFramework from '../../TestFramework'
import Activity from '../../../../api-lambda/src/entities/activity/Activity'
import ExamEvent from '../../../../api-lambda/src/enums/exam/ExamEvent'

const framework: TestFramework = globalThis.framework

describe('Approve exam', () => {
  test('Unauthorized', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const examId = exam.id.toString()
    const res = await request(framework.app).post('/').send(toggleExamApprove({ examId }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.apiError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid exam id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ExamPermission.Approve] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(toggleExamApprove({ examId: 'invalid' }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.apiError('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ExamPermission.Approve] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app)
      .post('/')
      .send(toggleExamApprove({ examId: id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.apiError('NotFoundError'))
  })
  test('Forbidden (no permission)', async () => {
    const user = await framework.fixture<User>(User)
    const exam = await framework.fixture<Exam>(Exam)
    const examId = exam.id.toString()
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(toggleExamApprove({ examId }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.apiError('ForbiddenError'))
  })
  test('Forbidden (ownership without permission)', async () => {
    const user = await framework.fixture<User>(User)
    const exam = await framework.fixture<Exam>(Exam, { creatorId: user.id, ownerId: user.id })
    const examId = exam.id.toString()
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(toggleExamApprove({ examId }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.apiError('ForbiddenError'))
  })
  test('Approved', async () => {
    await framework.clear(Exam)
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.fixture<User>(User, { permissions: [ExamPermission.Approve] })
    const token = (await framework.auth(user)).token
    const examId = exam.id.toString()
    const res = await request(framework.app)
      .post('/')
      .send(toggleExamApprove({ examId }, ['id', 'ownerId']))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { toggleExamApprove: { id: examId, ownerId: null } } })

    const updatedExam = await framework.load<Exam>(Exam, exam.id)
    expect(updatedExam).not.toHaveProperty('ownerId')

    expect(await framework.repo(Activity).countBy({ event: ExamEvent.Approved, examId: exam.id })).toEqual(1)
  })
  test('Un-approved', async () => {
    await framework.clear(Exam)
    const exam = await framework.fixture<Exam>(Exam, { ownerId: undefined })
    const user = await framework.fixture<User>(User, { permissions: [ExamPermission.Approve] })
    const token = (await framework.auth(user)).token
    const examId = exam.id.toString()
    const res = await request(framework.app)
      .post('/')
      .send(toggleExamApprove({ examId }, ['id', 'ownerId']))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({
      data: {
        toggleExamApprove: {
          id: examId,
          ownerId: exam.creatorId.toString()
        }
      }
    })

    const updatedExam = await framework.load<Exam>(Exam, exam.id)
    expect(updatedExam).toHaveProperty('ownerId')
    expect(updatedExam.ownerId.toString()).toEqual(exam.creatorId.toString())
  })
})
