import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../src/entities/user/User'
import Exam from '../../../../src/entities/exam/Exam'
import Category from '../../../../src/entities/category/Category'
import { ObjectId } from 'mongodb'
import ExamPermission from '../../../../src/enums/exam/ExamPermission'
// @ts-ignore
import { createExam } from '../../graphql/exam/createExam'
import CreateExam from '../../../../src/schema/exam/CreateExam'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Create exam', () => {
  test('Unauthorized', async () => {
    const category = await framework.fixture<Category>(Category, { ownerId: null })
    const res = await request(framework.app).post('/')
      .send(createExam({ createExam: { categoryId: category.id.toString() } }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (empty body)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Create ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(createExam({ createExam: {} as CreateExam }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User, { permissions: [] })
    const token = (await framework.auth(user)).token
    const category = await framework.fixture<Category>(Category, { ownerId: null })
    const res = await request(framework.app).post('/')
      .send(createExam({ createExam: { categoryId: category.id.toString() } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Conflict (not approved category)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Create ] })
    const token = (await framework.auth(user)).token
    const category = await framework.fixture<Category>(Category)
    const res = await request(framework.app).post('/')
      .send(createExam({ createExam: { categoryId: category.id.toString() } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ConflictError'))
  })
  test('Conflict (not approved questions)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Create ] })
    const token = (await framework.auth(user)).token
    const category = await framework.fixture<Category>(Category, { approvedQuestionCount: 0, ownerId: null })
    const res = await request(framework.app).post('/')
      .send(createExam({ createExam: { categoryId: category.id.toString() } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ConflictError'))
  })
  test('Conflict (exam taken)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Create ] })
    const token = (await framework.auth(user)).token
    const category = await framework.fixture<Category>(Category, { approvedQuestionCount: 1, ownerId: null })
    const exam = await framework.fixture<Exam>(Exam, { categoryId: category.id, completed: false, ownerId: user.id })
    const res = await request(framework.app).post('/')
      .send(createExam({ createExam: { categoryId: exam.categoryId.toString() } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ConflictError'))
  })
  test('Created', async () => {
    await framework.clear(Exam)
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Create ] })
    const token = (await framework.auth(user)).token
    const category = await framework.fixture<Category>(Category, { approvedQuestionCount: 1, ownerId: null })
    const create = { categoryId: category.id.toString() }
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
    const now = Date.now()
    const res = await request(framework.app).post('/')
      .send(createExam({ createExam: create }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { createExam: create } })
    expect(res.body.data.createExam).toHaveProperty('id')

    const id = new ObjectId(res.body.data.createExam.id)
    const createdExam = await framework.load<Exam>(Exam, id)
    expect({ ...createdExam, ...{ categoryId: createdExam.categoryId.toString() } }).toMatchObject(create)
    expect(res.body.data.createExam).toEqual({
      id: createdExam.id.toString(),
      categoryId: createdExam.categoryId.toString(),
      questionNumber: createdExam.questionNumber,
      completedAt: null,
      ownerId: createdExam.ownerId.toString(),
      questionCount: createdExam.questionCount(),
      answeredQuestionCount: createdExam.answeredQuestionCount(),
      createdAt: createdExam.createdAt.getTime(),
      updatedAt: null,
    })
    expect(createdExam.createdAt.getTime()).toBeGreaterThanOrEqual(now)
    expect(res.body.data.createExam).not.toHaveProperty([ 'creatorId', 'deletedAt' ])
  })
})