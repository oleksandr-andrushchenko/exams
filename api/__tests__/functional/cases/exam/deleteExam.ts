import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../src/entities/user/User'
import Exam from '../../../../src/entities/exam/Exam'
import ExamPermission from '../../../../src/enums/exam/ExamPermission'
// @ts-ignore
import { deleteExam } from '../../graphql/exam/deleteExam'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Delete exam', () => {
  test('Unauthorized', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const res = await request(framework.app).post('/')
      .send(deleteExam({ examId: exam.id.toString() }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Get, ExamPermission.Delete ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(deleteExam({ examId: 'invalid' }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Get, ExamPermission.Delete ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/')
      .send(deleteExam({ examId: id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const exam = await framework.fixture<Exam>(Exam)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(deleteExam({ examId: exam.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Deleted (has ownership)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.load<User>(User, exam.ownerId)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(deleteExam({ examId: exam.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { deleteExam: true } })
    expect(await framework.load<Exam>(Exam, exam.id)).toBeNull()
  })
  test('Deleted (has permission)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Get, ExamPermission.Delete ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(deleteExam({ examId: exam.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { deleteExam: true } })
    expect(await framework.load<Exam>(Exam, exam.id)).toBeNull()
  })
})