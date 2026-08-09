import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Exam from '../../../../api-lambda/src/server/entities/exam/Exam'
import User from '../../../../api-lambda/src/server/entities/user/User'
import ExamPermission from '../../../../api-lambda/src/server/enums/exam/ExamPermission'
// @ts-ignore
import { updateExam } from '../../graphql/exam/updateExam'
import UpdateExam from '../../../../api-lambda/src/server/schema/exam/UpdateExam'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Update exam', () => {
  test('Unauthorized', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const examId = exam.id.toString()
    const res = await request(framework.app)
      .post('/')
      .send(updateExam({ examId, updateExam: { name: 'Any' } }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid exam id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ExamPermission.Update] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(updateExam({ examId: 'invalid', updateExam: { name: 'Any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ExamPermission.Update] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app)
      .post('/')
      .send(updateExam({ examId: id.toString(), updateExam: { name: 'Any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test.each([
    { case: 'name too short', update: { name: 'a' } },
    { case: 'name too long', update: { name: 'abc'.repeat(99) } },
    { case: 'required score is string', update: { requiredScore: 'any' } },
    { case: 'required score is float', update: { requiredScore: 0.1 } },
    { case: 'required score is negative', update: { requiredScore: -1 } },
    { case: 'required score is greater then 100', update: { requiredScore: 101 } }
  ])('Bad request ($case)', async ({ update }) => {
    const exam = await framework.fixture<Exam>(Exam)
    const examId = exam.id.toString()
    const user = await framework.fixture<User>(User, { permissions: [ExamPermission.Update] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(updateExam({ examId, updateExam: update as UpdateExam }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const exam = await framework.fixture<Exam>(Exam)
    const examId = exam.id.toString()
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(updateExam({ examId, updateExam: { name: 'Any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Conflict', async () => {
    const exam1 = await framework.fixture<Exam>(Exam)
    const exam = await framework.fixture<Exam>(Exam, { permissions: [ExamPermission.Update] })
    const examId = exam.id.toString()
    const user = await framework.load<User>(User, exam.creatorId)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(updateExam({ examId, updateExam: { name: exam1.name } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ConflictError'))
  })
  test('Updated (has ownership)', async () => {
    await framework.clear(Exam)
    const exam = await framework.fixture<Exam>(Exam, { requiredScore: 1 })
    const user = await framework.load<User>(User, exam.creatorId)
    const token = (await framework.auth(user)).token
    const examId = exam.id.toString()
    const update = { name: 'any' }
    const res = await request(framework.app)
      .post('/')
      .send(updateExam({ examId, updateExam: update }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { updateExam: { id: examId } } })

    const updatedExam = await framework.load<Exam>(Exam, exam.id)
    expect(updatedExam).toMatchObject(update)

    // check if others remains to be the same
    expect(updatedExam).toMatchObject({
      requiredScore: exam.requiredScore
    })
  })
  test('Updated (has permission)', async () => {
    await framework.clear(Exam)
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.fixture<User>(User, { permissions: [ExamPermission.Update] })
    const token = (await framework.auth(user)).token
    const examId = exam.id.toString()
    const update = { name: 'any' }
    const res = await request(framework.app)
      .post('/')
      .send(updateExam({ examId, updateExam: update }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { updateExam: { id: examId } } })
    expect(await framework.load<Exam>(Exam, exam.id)).toMatchObject(update)
  })
})
