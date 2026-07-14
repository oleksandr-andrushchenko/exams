import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Category from '../../../../src/entities/category/Category'
import User from '../../../../src/entities/user/User'
import CategoryPermission from '../../../../src/enums/category/CategoryPermission'
// @ts-ignore
import { updateCategory } from '../../graphql/category/updateCategory'
import UpdateCategory from '../../../../src/schema/category/UpdateCategory'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Update category', () => {
  test('Unauthorized', async () => {
    const category = await framework.fixture<Category>(Category)
    const categoryId = category.id.toString()
    const res = await request(framework.app).post('/')
      .send(updateCategory({ categoryId, updateCategory: { name: 'Any' } }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid category id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.Update ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(updateCategory({ categoryId: 'invalid', updateCategory: { name: 'Any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.Update ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/')
      .send(updateCategory({ categoryId: id.toString(), updateCategory: { name: 'Any' } }))
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
    { case: 'required score is greater then 100', update: { requiredScore: 101 } },
  ])('Bad request ($case)', async ({ update }) => {
    const category = await framework.fixture<Category>(Category)
    const categoryId = category.id.toString()
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.Update ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(updateCategory({ categoryId, updateCategory: update as UpdateCategory }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const category = await framework.fixture<Category>(Category)
    const categoryId = category.id.toString()
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(updateCategory({ categoryId, updateCategory: { name: 'Any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Conflict', async () => {
    const category1 = await framework.fixture<Category>(Category)
    const category = await framework.fixture<Category>(Category, { permissions: [ CategoryPermission.Update ] })
    const categoryId = category.id.toString()
    const user = await framework.load<User>(User, category.creatorId)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(updateCategory({ categoryId, updateCategory: { name: category1.name } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ConflictError'))
  })
  test('Updated (has ownership)', async () => {
    await framework.clear(Category)
    const category = await framework.fixture<Category>(Category, { requiredScore: 1 })
    const user = await framework.load<User>(User, category.creatorId)
    const token = (await framework.auth(user)).token
    const categoryId = category.id.toString()
    const update = { name: 'any' }
    const res = await request(framework.app).post('/')
      .send(updateCategory({ categoryId, updateCategory: update }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { updateCategory: { id: categoryId } } })

    const updatedCategory = await framework.load<Category>(Category, category.id)
    expect(updatedCategory).toMatchObject(update)

    // check if others remains to be the same
    expect(updatedCategory).toMatchObject({
      requiredScore: category.requiredScore,
    })
  })
  test('Updated (has permission)', async () => {
    await framework.clear(Category)
    const category = await framework.fixture<Category>(Category)
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.Update ] })
    const token = (await framework.auth(user)).token
    const categoryId = category.id.toString()
    const update = { name: 'any' }
    const res = await request(framework.app).post('/')
      .send(updateCategory({ categoryId, updateCategory: update }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { updateCategory: { id: categoryId } } })
    expect(await framework.load<Category>(Category, category.id)).toMatchObject(update)
  })
})