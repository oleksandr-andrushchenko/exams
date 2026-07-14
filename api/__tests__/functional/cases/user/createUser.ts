import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../src/entities/user/User'
import { ObjectId } from 'mongodb'
import UserPermission from '../../../../src/enums/user/UserPermission'
// @ts-ignore
import { createUser } from '../../graphql/user/createUser'
import CreateUser from '../../../../src/schema/user/CreateUser'
import Permission from '../../../../src/enums/Permission'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Create user', () => {
  test('Unauthorized', async () => {
    const res = await request(framework.app).post('/')
      .send(createUser({ createUser: { email: 'a@a.com', password: 'password' } }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test.each([
    { case: 'empty user', user: {}, times: 2 },
    { case: 'name is an object', user: { name: {}, email: 'a@a.com', password: 'password' } },
    { case: 'name is a number', user: { name: 123123, email: 'a@a.com', password: 'password' } },
    { case: 'name is too short', user: { name: 'a', email: 'a@a.com', password: 'password' } },
    { case: 'name is too long', user: { name: 'abc'.repeat(99), email: 'a@a.com', password: 'password' } },
    { case: 'email is missed', user: { password: 'password' } },
    { case: 'email is null', user: { email: null, password: 'password' } },
    { case: 'email is undefined', user: { email: undefined, password: 'password' } },
    { case: 'email is a number', user: { email: 123123, password: 'password' } },
    { case: 'email is an object', user: { email: {}, password: 'password' } },
    { case: 'password is missed', user: { email: 'a@a.com' } },
    { case: 'password is null', user: { email: 'a@a.com', password: null } },
    { case: 'password is undefined', user: { email: 'a@a.com', password: undefined } },
    { case: 'password is a number', user: { email: 'a@a.com', password: 123123 } },
    { case: 'password is an object', user: { email: 'a@a.com', password: {} } },
    { case: 'password is too short', user: { email: 'a@a.com', password: 'p' } },
    { case: 'password is too long', user: { email: 'a@a.com', password: 'abc'.repeat(99) } },
    { case: 'permissions is a string', user: { email: 'a@a.com', password: 'password', permissions: 'invalid' } },
    { case: 'permissions is an integer', user: { email: 'a@a.com', password: 'password', permissions: 123 } },
    { case: 'permissions is an object', user: { email: 'a@a.com', password: 'password', permissions: {} } },
    { case: 'permissions is invalid', user: { email: 'a@a.com', password: 'password', permissions: [ 'any' ] } },
  ])('Bad request ($case)', async ({ user: userCreate, times = 1 }) => {
    const user = await framework.fixture<User>(User, { permissions: [ UserPermission.Create ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(createUser({ createUser: userCreate as CreateUser }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError(...Array(times).fill('BadRequestError')))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(createUser({
        createUser: {
          name: 'any',
          email: 'a@a.com',
          password: '123123',
        },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Conflict (email)', async () => {
    const user1 = await framework.fixture<User>(User)
    const user = await framework.fixture<User>(User, { permissions: [ UserPermission.Create ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(createUser({
        createUser: {
          name: 'any',
          email: user1.email,
          password: '123123',
        },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ConflictError'))
  })
  test('Created', async () => {
    await framework.clear(User)
    const user = await framework.fixture<User>(User, { permissions: [ UserPermission.Create, UserPermission.GetEmail, UserPermission.GetPermissions ] })
    const token = (await framework.auth(user)).token
    const userCreate = { name: 'any', email: 'a@a.com' }
    const fields = [ 'id', 'name', 'email', 'permissions', 'createdAt', 'updatedAt' ]
    const now = Date.now()
    const res = await request(framework.app).post('/')
      .send(createUser({ createUser: { ...userCreate, ...{ password: '123123' } } }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('createUser')
    expect(res.body.data.createUser).toHaveProperty('id')

    const id = new ObjectId(res.body.data.createUser.id)
    const createdUser = await framework.load<User>(User, id)
    expect(createdUser).toMatchObject(userCreate)
    expect(res.body.data.createUser).toMatchObject({
      id: id.toString(),
      name: createdUser.name,
      email: createdUser.email,
      permissions: [ Permission.Regular ],
      createdAt: createdUser.createdAt.getTime(),
      updatedAt: null,
    })
    expect(createdUser.createdAt.getTime()).toBeGreaterThanOrEqual(now)
    expect(res.body.data.createUser).not.toHaveProperty([ 'password', 'creatorId', 'deletedAt' ])
  })
})