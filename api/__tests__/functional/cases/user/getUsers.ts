import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import TestFramework from '../../TestFramework'
import User from '../../../../src/entities/user/User'
// @ts-ignore
import { getUsers } from '../../graphql/user/getUsers'
import UserPermission from '../../../../src/enums/user/UserPermission'
import GetUsers from '../../../../src/schema/user/GetUsers'

const framework: TestFramework = globalThis.framework

describe('Get users', () => {
  test('Unauthorized', async () => {
    const res = await request(framework.app).post('/').send(getUsers())

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/').send(getUsers()).auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test.each([
    { case: 'invalid cursor type', query: { cursor: 1 } },
    { case: 'not allowed cursor', query: { cursor: 'name' } },
    { case: 'invalid size type', query: { size: 'any' } },
    { case: 'negative size', query: { size: -1 } },
    { case: 'zero size', query: { size: 0 } },
    { case: 'size greater them max', query: { size: 1000 } },
    { case: 'invalid order type', query: { order: 1 } },
    { case: 'not allowed order', query: { order: 'any' } },
  ])('Bad request ($case)', async ({ query }) => {
    const user = await framework.fixture<User>(User, { permissions: [ UserPermission.Get ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(getUsers(query as GetUsers))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('No filter', async () => {
    framework.clear()
    const user = await framework.fixture<User>(User, { permissions: [ UserPermission.Get, UserPermission.GetEmail, UserPermission.GetPermissions ] })
    const token = (await framework.auth(user)).token
    const users = await Promise.all([
      framework.fixture<User>(User),
      framework.fixture<User>(User),
    ])
    users.unshift(user)
    const fields = [ 'id', 'name', 'email', 'permissions', 'createdAt', 'updatedAt' ]
    const res = await request(framework.app).post('/')
      .send(getUsers({}, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body.data.users).toHaveLength(users.length)

    const resUsers = res.body.data.users.sort((a, b) => a.id.localeCompare(b.id))
    for (const index in users.sort((a, b) => a.id.toString().localeCompare(b.id.toString()))) {
      expect(resUsers[index]).toMatchObject({
        id: users[index].id.toString(),
        name: users[index].name,
        email: users[index].email,
        permissions: users[index].permissions,
        createdAt: users[index].createdAt.getTime(),
        updatedAt: users[index].updatedAt?.getTime() ?? null,
      })
      expect(resUsers[index]).not.toHaveProperty([ 'creatorId', 'deletedAt', 'creatorId', 'ownerId' ])
    }
  })
  test('Search filter', async () => {
    framework.clear()
    const user = await framework.fixture<User>(User, { permissions: [ UserPermission.Get, UserPermission.GetEmail, UserPermission.GetPermissions ] })
    const token = (await framework.auth(user)).token
    const users = await Promise.all([
      framework.fixture<User>(User),
      framework.fixture<User>(User),
    ])
    const fields = [ 'id', 'name', 'email', 'permissions', 'createdAt', 'updatedAt' ]
    const index = 0
    const search = users[index].name.slice(0, -1)
    const res = await request(framework.app).post('/')
      .send(getUsers({ search }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body.data.users).toHaveLength(1)

    const resUsers = res.body.data.users
    expect(resUsers[index]).toMatchObject({
      id: users[index].id.toString(),
      name: users[index].name,
      email: users[index].email,
      permissions: users[index].permissions,
      createdAt: users[index].createdAt.getTime(),
      updatedAt: users[index].updatedAt?.getTime() ?? null,
    })
    expect(resUsers[index]).not.toHaveProperty([ 'creatorId', 'deletedAt', 'creatorId', 'ownerId' ])
  })
})