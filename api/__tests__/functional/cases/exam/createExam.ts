import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Exam from '../../../../src/entities/exam/Exam'
import User from '../../../../src/entities/user/User'
import { ObjectId } from 'bson'
import ExamPermission from '../../../../src/enums/exam/ExamPermission'
// @ts-ignore
import { createExam } from '../../graphql/exam/createExam'
import CreateExam from '../../../../src/schema/exam/CreateExam'
import TestFramework from '../../TestFramework'
import Activity from '../../../../src/entities/activity/Activity'
import ExamEvent from '../../../../src/enums/exam/ExamEvent'

const framework: TestFramework = globalThis.framework

describe('Create exam', () => {
  test('Unauthorized', async () => {
    const res = await request(framework.app).post('/').send(createExam({ createExam: { name: 'any' } }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test.each([
    { case: 'empty exam', exam: {} },
    { case: 'no name', exam: { requiredScore: 80 } },
    { case: 'name is null', exam: { name: null, requiredScore: 80 } },
    { case: 'name is undefined', exam: { name: undefined, requiredScore: 80 } },
    { case: 'name too short', exam: { name: 'a', requiredScore: 80 } },
    { case: 'name too long', exam: { name: 'abc'.repeat(99), requiredScore: 80 } },
    { case: 'required score is null', exam: { name: 'Any exam', requiredScore: null } },
    { case: 'required score is string', exam: { name: 'Any exam', requiredScore: 'any' } },
    { case: 'required score is float', exam: { name: 'Any exam', requiredScore: 0.1 } },
    { case: 'required score is negative', exam: { name: 'Any exam', requiredScore: -1 } },
    { case: 'required score is greater then 100', exam: { name: 'Any exam', requiredScore: 101 } },
  ])('Bad request ($case)', async ({ exam }) => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Create ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(createExam({ createExam: exam as CreateExam }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User, { permissions: [] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(createExam({ createExam: { name: 'any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Conflict', async () => {
    await framework.clear(Exam)
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Create ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(createExam({ createExam: { name: exam.name } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ConflictError'))
  })
  test('Created', async () => {
    await framework.clear(Exam)
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Create ] })
    const token = (await framework.auth(user)).token
    const exam = { name: 'any', requiredScore: 80 }
    const fields = [ 'id', 'name', 'questionCount', 'requiredScore', 'rating {markCount averageMark}', 'createdAt', 'updatedAt' ]
    const now = Date.now()
    const res = await request(framework.app).post('/')
      .send(createExam({ createExam: exam }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { createExam: exam } })
    expect(res.body.data.createExam).toHaveProperty('id')

    const id = new ObjectId(res.body.data.createExam.id)
    const createdExam = await framework.load<Exam>(Exam, id)
    expect(createdExam).toMatchObject(exam)
    expect(res.body.data.createExam).toEqual({
      id: createdExam.id.toString(),
      name: createdExam.name,
      questionCount: createdExam.questionCount,
      requiredScore: createdExam.requiredScore,
      rating: null,
      createdAt: createdExam.createdAt.getTime(),
      updatedAt: null,
    })
    expect(createdExam.createdAt.getTime()).toBeGreaterThanOrEqual(now)
    expect(res.body.data.createExam).not.toHaveProperty([ 'creatorId', 'deletedAt' ])

    expect(await framework.repo(Activity).countBy({ event: ExamEvent.Created, examId: id })).toEqual(1)
  })
})