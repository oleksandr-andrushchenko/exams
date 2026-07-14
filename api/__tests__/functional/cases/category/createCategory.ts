import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Category from '../../../../src/entities/category/Category'
import User from '../../../../src/entities/user/User'
import { ObjectId } from 'mongodb'
import CategoryPermission from '../../../../src/enums/category/CategoryPermission'
// @ts-ignore
import { createCategory } from '../../graphql/category/createCategory'
import CreateCategory from '../../../../src/schema/category/CreateCategory'
import TestFramework from '../../TestFramework'
import Activity from '../../../../src/entities/activity/Activity'
import CategoryEvent from '../../../../src/enums/category/CategoryEvent'

const framework: TestFramework = globalThis.framework

describe('Create category', () => {
  test('Unauthorized', async () => {
    const res = await request(framework.app).post('/').send(createCategory({ createCategory: { name: 'any' } }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test.each([
    { case: 'empty category', category: {} },
    { case: 'no name', category: { requiredScore: 80 } },
    { case: 'name is null', category: { name: null, requiredScore: 80 } },
    { case: 'name is undefined', category: { name: undefined, requiredScore: 80 } },
    { case: 'name too short', category: { name: 'a', requiredScore: 80 } },
    { case: 'name too long', category: { name: 'abc'.repeat(99), requiredScore: 80 } },
    { case: 'required score is null', category: { name: 'Any category', requiredScore: null } },
    { case: 'required score is string', category: { name: 'Any category', requiredScore: 'any' } },
    { case: 'required score is float', category: { name: 'Any category', requiredScore: 0.1 } },
    { case: 'required score is negative', category: { name: 'Any category', requiredScore: -1 } },
    { case: 'required score is greater then 100', category: { name: 'Any category', requiredScore: 101 } },
  ])('Bad request ($case)', async ({ category }) => {
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.Create ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(createCategory({ createCategory: category as CreateCategory }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User, { permissions: [] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(createCategory({ createCategory: { name: 'any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Conflict', async () => {
    await framework.clear(Category)
    const category = await framework.fixture<Category>(Category)
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.Create ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(createCategory({ createCategory: { name: category.name } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ConflictError'))
  })
  test('Created', async () => {
    await framework.clear(Category)
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.Create ] })
    const token = (await framework.auth(user)).token
    const category = { name: 'any', requiredScore: 80 }
    const fields = [ 'id', 'name', 'questionCount', 'requiredScore', 'rating {markCount averageMark}', 'createdAt', 'updatedAt' ]
    const now = Date.now()
    const res = await request(framework.app).post('/')
      .send(createCategory({ createCategory: category }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { createCategory: category } })
    expect(res.body.data.createCategory).toHaveProperty('id')

    const id = new ObjectId(res.body.data.createCategory.id)
    const createdCategory = await framework.load<Category>(Category, id)
    expect(createdCategory).toMatchObject(category)
    expect(res.body.data.createCategory).toEqual({
      id: createdCategory.id.toString(),
      name: createdCategory.name,
      questionCount: createdCategory.questionCount,
      requiredScore: createdCategory.requiredScore,
      rating: null,
      createdAt: createdCategory.createdAt.getTime(),
      updatedAt: null,
    })
    expect(createdCategory.createdAt.getTime()).toBeGreaterThanOrEqual(now)
    expect(res.body.data.createCategory).not.toHaveProperty([ 'creatorId', 'deletedAt' ])

    expect(await framework.repo(Activity).countBy({ event: CategoryEvent.Created, categoryId: id })).toEqual(1)
  })
})