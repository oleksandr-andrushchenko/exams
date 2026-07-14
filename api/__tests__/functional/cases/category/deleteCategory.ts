import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Category from '../../../../src/entities/category/Category'
import User from '../../../../src/entities/user/User'
import CategoryPermission from '../../../../src/enums/category/CategoryPermission'
// @ts-ignore
import { deleteCategory } from '../../graphql/category/deleteCategory'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Delete category', () => {
  test('Unauthorized', async () => {
    const category = await framework.fixture<Category>(Category)
    const res = await request(framework.app).post('/')
      .send(deleteCategory({ categoryId: category.id.toString() }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.Delete ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(deleteCategory({ categoryId: 'invalid' }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.Delete ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/')
      .send(deleteCategory({ categoryId: id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const category = await framework.fixture<Category>(Category)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(deleteCategory({ categoryId: category.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Deleted (has ownership)', async () => {
    const category = await framework.fixture<Category>(Category)
    const user = await framework.load<User>(User, category.creatorId)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(deleteCategory({ categoryId: category.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { deleteCategory: true } })
    expect(await framework.load<Category>(Category, category.id)).toBeNull()
  })
  test('Deleted (has permission)', async () => {
    const category = await framework.fixture<Category>(Category)
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.Delete ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(deleteCategory({ categoryId: category.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { deleteCategory: true } })
    expect(await framework.load<Category>(Category, category.id)).toBeNull()
  })
})