import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Category from '../../../../src/entities/category/Category'
import User from '../../../../src/entities/user/User'
import CategoryPermission from '../../../../src/enums/category/CategoryPermission'
// @ts-ignore
import { toggleCategoryApprove } from '../../graphql/category/toggleCategoryApprove'
import TestFramework from '../../TestFramework'
import Activity from '../../../../src/entities/activity/Activity'
import CategoryEvent from '../../../../src/enums/category/CategoryEvent'

const framework: TestFramework = globalThis.framework

describe('Approve category', () => {
  test('Unauthorized', async () => {
    const category = await framework.fixture<Category>(Category)
    const categoryId = category.id.toString()
    const res = await request(framework.app).post('/')
      .send(toggleCategoryApprove({ categoryId }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid category id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.Approve ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(toggleCategoryApprove({ categoryId: 'invalid' }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.Approve ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/')
      .send(toggleCategoryApprove({ categoryId: id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Forbidden (no permission)', async () => {
    const user = await framework.fixture<User>(User)
    const category = await framework.fixture<Category>(Category)
    const categoryId = category.id.toString()
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(toggleCategoryApprove({ categoryId }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Forbidden (ownership without permission)', async () => {
    const user = await framework.fixture<User>(User)
    const category = await framework.fixture<Category>(Category, { creatorId: user.id, ownerId: user.id })
    const categoryId = category.id.toString()
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(toggleCategoryApprove({ categoryId }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Approved', async () => {
    await framework.clear(Category)
    const category = await framework.fixture<Category>(Category)
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.Approve ] })
    const token = (await framework.auth(user)).token
    const categoryId = category.id.toString()
    const res = await request(framework.app).post('/')
      .send(toggleCategoryApprove({ categoryId }, [ 'id', 'ownerId' ]))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { toggleCategoryApprove: { id: categoryId, ownerId: null } } })

    const updatedCategory = await framework.load<Category>(Category, category.id)
    expect(updatedCategory).not.toHaveProperty('ownerId')

    expect(await framework.repo(Activity).countBy({ event: CategoryEvent.Approved, categoryId: category.id })).toEqual(1)
  })
  test('Un-approved', async () => {
    await framework.clear(Category)
    const category = await framework.fixture<Category>(Category, { ownerId: undefined })
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.Approve ] })
    const token = (await framework.auth(user)).token
    const categoryId = category.id.toString()
    const res = await request(framework.app).post('/')
      .send(toggleCategoryApprove({ categoryId }, [ 'id', 'ownerId' ]))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({
      data: {
        toggleCategoryApprove: {
          id: categoryId,
          ownerId: category.creatorId.toString(),
        },
      },
    })

    const updatedCategory = await framework.load<Category>(Category, category.id)
    expect(updatedCategory).toHaveProperty('ownerId')
    expect(updatedCategory.ownerId.toString()).toEqual(category.creatorId.toString())
  })
})