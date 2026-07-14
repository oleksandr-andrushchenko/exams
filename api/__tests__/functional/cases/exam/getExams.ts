import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../src/entities/user/User'
import Exam from '../../../../src/entities/exam/Exam'
import Category from '../../../../src/entities/category/Category'
import ExamPermission from '../../../../src/enums/exam/ExamPermission'
// @ts-ignore
import { getExams } from '../../graphql/exam/getExams'
import GetExams from '../../../../src/schema/exam/GetExams'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Get exams', () => {
  test('Unauthorized', async () => {
    const res = await request(framework.app).post('/')
      .send(getExams())

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test.each([
    { case: 'invalid category type', query: { categoryId: 1 } },
    { case: 'invalid category', query: { categoryId: 'any' } },
    { case: 'invalid cursor type', query: { cursor: 1 } },
    { case: 'not allowed cursor', query: { cursor: 'name' } },
    { case: 'invalid size type', query: { size: 'any' } },
    { case: 'negative size', query: { size: -1 } },
    { case: 'zero size', query: { size: 0 } },
    { case: 'size greater them max', query: { size: 1000 } },
    { case: 'invalid order type', query: { order: 1 } },
    { case: 'not allowed order', query: { order: 'any' } },
  ])('Bad request ($case)', async ({ query }) => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(getExams(query as GetExams))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Empty', async () => {
    await framework.clear(Exam)
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(getExams())
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toEqual({ data: { exams: [] } })
  })
  test('No filter (ownership)', async () => {
    await framework.clear(Exam)
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const ownerId = user.id
    const examOwnOptions = { ownerId }
    const exams = (await Promise.all([
      framework.fixture<Exam>(Exam, examOwnOptions),
      framework.fixture<Exam>(Exam),
      framework.fixture<Exam>(Exam, examOwnOptions),
    ])).sort((a: Exam, b: Exam) => a.id.toString().localeCompare(b.id.toString()))

    const fields = [ 'id', 'categoryId', 'questionNumber', 'completedAt', 'createdAt', 'updatedAt', 'ownerId' ]
    const res = await request(framework.app).post('/')
      .send(getExams({}, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)

    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('exams')

    const ownExams = exams.filter(exam => exam.ownerId.toString() === ownerId.toString())
    expect(res.body.data.exams).toHaveLength(ownExams.length)

    const resExams = res.body.data.exams.sort((a, b) => a.id.localeCompare(b.id))

    for (const index in ownExams) {
      expect(resExams[index]).toMatchObject({
        id: ownExams[index].id.toString(),
        categoryId: ownExams[index].categoryId.toString(),
        questionNumber: ownExams[index].questionNumber,
        completedAt: ownExams[index].completedAt?.getTime() ?? null,
        ownerId: ownExams[index].ownerId.toString(),
        createdAt: ownExams[index].createdAt.getTime(),
        updatedAt: ownExams[index].updatedAt?.getTime() ?? null,
      })
      expect(resExams[index]).not.toHaveProperty([ 'questions', 'creatorId', 'deletedAt' ])
    }
  })
  test('Category filter (ownership)', async () => {
    await framework.clear(Exam)
    const category = await framework.fixture<Category>(Category)
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const ownerId = user.id
    const examOwnOptions = { ownerId }
    const examCategoryOptions = { categoryId: category.id }
    const exams = (await Promise.all([
      framework.fixture<Exam>(Exam, examOwnOptions),
      framework.fixture<Exam>(Exam, examCategoryOptions),
      framework.fixture<Exam>(Exam, { ...examOwnOptions, ...examCategoryOptions }),
    ])).sort((a: Exam, b: Exam) => a.id.toString().localeCompare(b.id.toString()))

    const fields = [ 'id', 'categoryId', 'questionNumber', 'completedAt', 'createdAt', 'updatedAt', 'ownerId' ]
    const res = await request(framework.app).post('/')
      .send(getExams({ categoryId: category.id.toString() }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)

    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('exams')

    const ownCategoryExams = exams
      .filter(exam => exam.ownerId.toString() === ownerId.toString())
      .filter(exam => exam.categoryId.toString() === category.id.toString())
    expect(res.body.data.exams).toHaveLength(ownCategoryExams.length)

    const resExams = res.body.data.exams.sort((a, b) => a.id.localeCompare(b.id))

    for (const index in ownCategoryExams) {
      expect(resExams[index]).toMatchObject({
        id: ownCategoryExams[index].id.toString(),
        categoryId: ownCategoryExams[index].categoryId.toString(),
        questionNumber: ownCategoryExams[index].questionNumber,
        completedAt: ownCategoryExams[index].completedAt?.getTime() ?? null,
        ownerId: ownCategoryExams[index].ownerId.toString(),
        createdAt: ownCategoryExams[index].createdAt.getTime(),
        updatedAt: ownCategoryExams[index].updatedAt?.getTime() ?? null,
      })
      expect(resExams[index]).not.toHaveProperty([ 'questions', 'creatorId', 'deletedAt' ])
    }
  })
  test('No filter (permission)', async () => {
    await framework.clear(Exam)
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Get ] })
    const token = (await framework.auth(user)).token
    const ownerId = user.id
    const examOwnOptions = { ownerId }
    const exams = (await Promise.all([
      framework.fixture<Exam>(Exam),
      framework.fixture<Exam>(Exam, examOwnOptions),
      framework.fixture<Exam>(Exam),
    ])).sort((a: Exam, b: Exam) => a.id.toString().localeCompare(b.id.toString()))

    const fields = [ 'id', 'categoryId', 'questionNumber', 'completedAt', 'createdAt', 'updatedAt', 'ownerId' ]
    const res = await request(framework.app).post('/')
      .send(getExams({}, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)

    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('exams')

    expect(res.body.data.exams).toHaveLength(exams.length)

    const resExams = res.body.data.exams.sort((a, b) => a.id.localeCompare(b.id))

    for (const index in exams) {
      expect(resExams[index]).toMatchObject({
        id: exams[index].id.toString(),
        categoryId: exams[index].categoryId.toString(),
        questionNumber: exams[index].questionNumber,
        completedAt: exams[index].completedAt?.getTime() ?? null,
        ownerId: exams[index].ownerId.toString(),
        createdAt: exams[index].createdAt.getTime(),
        updatedAt: exams[index].updatedAt?.getTime() ?? null,
      })
      expect(resExams[index]).not.toHaveProperty([ 'questions', 'creatorId', 'deletedAt' ])
    }
  })
  test('Category filter (permission)', async () => {
    await framework.clear(Exam)
    const category = await framework.fixture<Category>(Category)
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Get ] })
    const token = (await framework.auth(user)).token
    const ownerId = user.id
    const examOwnOptions = { ownerId }
    const examCategoryOptions = { categoryId: category.id }
    const exams = (await Promise.all([
      framework.fixture<Exam>(Exam),
      framework.fixture<Exam>(Exam, examOwnOptions),
      framework.fixture<Exam>(Exam, { ...examOwnOptions, ...examCategoryOptions }),
    ])).sort((a: Exam, b: Exam) => a.id.toString().localeCompare(b.id.toString()))

    const fields = [ 'id', 'categoryId', 'questionNumber', 'completedAt', 'createdAt', 'updatedAt', 'ownerId' ]
    const res = await request(framework.app).post('/')
      .send(getExams({ categoryId: category.id.toString() }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)

    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('exams')

    const categoryExams = exams.filter(exam => exam.categoryId.toString() === category.id.toString())
    expect(res.body.data.exams).toHaveLength(categoryExams.length)

    const resExams = res.body.data.exams.sort((a, b) => a.id.localeCompare(b.id))

    for (const index in categoryExams) {
      expect(resExams[index]).toMatchObject({
        id: categoryExams[index].id.toString(),
        categoryId: categoryExams[index].categoryId.toString(),
        questionNumber: categoryExams[index].questionNumber,
        completedAt: categoryExams[index].completedAt?.getTime() ?? null,
        ownerId: categoryExams[index].ownerId.toString(),
        createdAt: categoryExams[index].createdAt.getTime(),
        updatedAt: categoryExams[index].updatedAt?.getTime() ?? null,
      })
      expect(resExams[index]).not.toHaveProperty([ 'questions', 'creatorId', 'deletedAt' ])
    }
  })
})