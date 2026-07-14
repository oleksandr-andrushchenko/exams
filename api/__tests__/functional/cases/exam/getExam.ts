import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Exam from '../../../../src/entities/exam/Exam'
import User from '../../../../src/entities/user/User'
import ExamPermission from '../../../../src/enums/exam/ExamPermission'
// @ts-ignore
import { getExam } from '../../graphql/exam/getExam'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Get exam', () => {
  test('Unauthorized', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const res = await request(framework.app).post('/')
      .send(getExam({ examId: exam.id.toString() }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Get ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(getExam({ examId: 'invalid' }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Get ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/')
      .send(getExam({ examId: id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const exam = await framework.fixture<Exam>(Exam)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(getExam({ examId: exam.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Found (ownership)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.load<User>(User, exam.ownerId)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(getExam({ examId: exam.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { exam: { id: exam.id.toString() } } })
  })
  test('Found (permission)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Get ] })
    const token = (await framework.auth(user)).token
    const fields = [
      'id',
      'categoryId',
      'questionNumber',
      'completedAt',
      'ownerId',
      'questionCount',
      'answeredQuestionCount',
      'createdAt',
      'updatedAt',
    ]
    const res = await request(framework.app).post('/')
      .send(getExam({ examId: exam.id.toString() }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({
      data: {
        exam: {
          id: exam.id.toString(),
          categoryId: exam.categoryId.toString(),
          questionNumber: exam.questionNumber,
          completedAt: exam.completedAt?.getTime() ?? null,
          ownerId: exam.ownerId.toString(),
          questionCount: exam.questionCount(),
          answeredQuestionCount: exam.answeredQuestionCount(),
          createdAt: exam.createdAt.getTime(),
          updatedAt: exam.updatedAt?.getTime() ?? null,
        },
      },
    })
    expect(res.body.data.exam).not.toHaveProperty([ 'questions', 'correctAnswerCount', 'creatorId', 'deletedAt' ])
  })
})