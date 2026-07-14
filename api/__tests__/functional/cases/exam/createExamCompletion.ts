import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Exam from '../../../../src/entities/exam/Exam'
import User from '../../../../src/entities/user/User'
import ExamPermission from '../../../../src/enums/exam/ExamPermission'
// @ts-ignore
import { createExamCompletion } from '../../graphql/exam/createExamCompletion'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Create exam completion', () => {
  test('Unauthorized', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const res = await request(framework.app).post('/')
      .send(createExamCompletion({ examId: exam.id.toString() }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid exam id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Get, ExamPermission.CreateCompletion ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(createExamCompletion({ examId: 'invalid' }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Get, ExamPermission.CreateCompletion ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/')
      .send(createExamCompletion({ examId: id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const exam = await framework.fixture<Exam>(Exam)
    const res = await request(framework.app).post('/')
      .send(createExamCompletion({ examId: exam.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Created (has ownership)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.load<User>(User, exam.ownerId)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(createExamCompletion({ examId: exam.id.toString() }, [ 'id', 'completedAt' ]))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { createExamCompletion: { id: exam.id.toString() } } })
    expect(res.body.data.createExamCompletion.completedAt).toBeGreaterThan(0)
    expect((await framework.load<Exam>(Exam, exam.id)).completedAt.getTime())
      .toEqual(res.body.data.createExamCompletion.completedAt)
  })
  test('Created (has permission)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Get, ExamPermission.CreateCompletion ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(createExamCompletion({ examId: exam.id.toString() }, [ 'id', 'completedAt' ]))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { createExamCompletion: { id: exam.id.toString() } } })
    expect(res.body.data.createExamCompletion.completedAt).toBeGreaterThan(0)
    expect((await framework.load<Exam>(Exam, exam.id)).completedAt.getTime())
      .toEqual(res.body.data.createExamCompletion.completedAt)
  })
})