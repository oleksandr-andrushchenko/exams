import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../src/entities/user/User'
import Exam from '../../../../src/entities/exam/Exam'
import Category from '../../../../src/entities/category/Category'
// @ts-ignore
import { getCurrentExams } from '../../graphql/exam/getCurrentExams'
import TestFramework from '../../TestFramework'
import GetCurrentExams from '../../../../src/schema/exam/GetCurrentExams'

const framework: TestFramework = globalThis.framework

describe('Get current exams', () => {
  test('Unauthorized', async () => {
    const category = await framework.fixture<Category>(Category)
    const res = await request(framework.app).post('/')
      .send(getCurrentExams({ categoryIds: [ category.id.toString() ] }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test.each([
    { case: 'empty body', query: {} },
    { case: 'category ids is null', query: { categoryIds: null } },
    { case: 'category ids is number', query: { categoryIds: 1 } },
    { case: 'category ids is empty array', query: { categoryIds: [] } },
    { case: 'category ids with null', query: { categoryIds: [ null ] } },
    { case: 'category ids with number', query: { categoryIds: [ 1 ] } },
    { case: 'category ids with invalid id', query: { categoryIds: [ 'any' ] } },
  ])('Bad request ($case)', async ({ query }) => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(getCurrentExams(query as GetCurrentExams))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Empty', async () => {
    await framework.clear(Exam)
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const category = await framework.fixture<Category>(Category)
    const res = await request(framework.app).post('/')
      .send(getCurrentExams({ categoryIds: [ category.id.toString() ] }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toEqual({ data: { currentExams: [] } })
  })
  test('Non-empty', async () => {
    await framework.clear()
    const categories = (await Promise.all([
      framework.fixture<Category>(Category),
      framework.fixture<Category>(Category),
      framework.fixture<Category>(Category),
    ]))
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const exams = (await Promise.all([
      framework.fixture<Exam>(Exam, { categoryId: categories[0].id, ownerId: user.id, completed: false }),
      framework.fixture<Exam>(Exam, { categoryId: categories[1].id, ownerId: user.id, completed: true }),
      framework.fixture<Exam>(Exam, { categoryId: categories[2].id, ownerId: user.id, completed: false }),
    ])).sort((a, b) => a.id.toString().localeCompare(b.id.toString()))

    const fields = [ 'id', 'categoryId', 'questionNumber', 'completedAt', 'createdAt', 'updatedAt', 'ownerId' ]
    const res = await request(framework.app).post('/')
      .send(getCurrentExams({ categoryIds: categories.map(category => category.id.toString()) }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)

    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('currentExams')

    const currentExams = exams.filter(exam => !exam.completedAt)
    expect(res.body.data.currentExams).toHaveLength(currentExams.length)

    const resExams = res.body.data.currentExams.sort((a, b) => a.id.localeCompare(b.id))

    for (const index in currentExams) {
      expect(resExams[index]).toMatchObject({
        id: currentExams[index].id.toString(),
        categoryId: currentExams[index].categoryId.toString(),
        questionNumber: currentExams[index].questionNumber,
        completedAt: currentExams[index].completedAt?.getTime() ?? null,
        ownerId: currentExams[index].ownerId.toString(),
        createdAt: currentExams[index].createdAt.getTime(),
        updatedAt: currentExams[index].updatedAt?.getTime() ?? null,
      })
      expect(resExams[index]).not.toHaveProperty([ 'questions', 'creatorId', 'deletedAt' ])
    }
  })
})