import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../src/entities/user/User'
import { ObjectId } from 'mongodb'
// @ts-ignore
import { createMe } from '../../graphql/me/createMe'
import CreateMe from '../../../../src/schema/user/CreateMe'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Create me', () => {
  test.each([
    { case: 'empty me', me: {}, times: 2 },
    { case: 'name is an object', me: { name: {}, email: 'a@a.com', password: 'password' } },
    { case: 'name is a number', me: { name: 123123, email: 'a@a.com', password: 'password' } },
    { case: 'name is too short', me: { name: 'a', email: 'a@a.com', password: 'password' } },
    { case: 'name is too long', me: { name: 'abc'.repeat(99), email: 'a@a.com', password: 'password' } },
    { case: 'email is missed', me: { password: 'password' } },
    { case: 'email is null', me: { email: null, password: 'password' } },
    { case: 'email is undefined', me: { email: undefined, password: 'password' } },
    { case: 'email is a number', me: { email: 123123, password: 'password' } },
    { case: 'email is an object', me: { email: {}, password: 'password' } },
    { case: 'password is missed', me: { email: 'a@a.com' } },
    { case: 'password is null', me: { email: 'a@a.com', password: null } },
    { case: 'password is undefined', me: { email: 'a@a.com', password: undefined } },
    { case: 'password is a number', me: { email: 'a@a.com', password: 123123 } },
    { case: 'password is an object', me: { email: 'a@a.com', password: {} } },
    { case: 'password is too short', me: { email: 'a@a.com', password: 'p' } },
    { case: 'password is too long', me: { email: 'a@a.com', password: 'abc'.repeat(99) } },
  ])('Bad request ($case)', async ({ me, times = 1 }) => {
    const res = await request(framework.app).post('/')
      .send(createMe({ createMe: me as CreateMe }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError(...Array(times).fill('BadRequestError')))
  })
  test('Conflict (email)', async () => {
    const user = await framework.fixture<User>(User)
    const res = await request(framework.app).post('/')
      .send(createMe({
        createMe: {
          name: 'any',
          email: user.email,
          password: '123123',
        },
      }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ConflictError'))
  })
  test('Created', async () => {
    await framework.clear(User)
    const me = { name: 'any', email: 'a@a.com' }
    const fields = [ 'id', 'name', 'createdAt', 'updatedAt' ]
    const now = Date.now()
    const res = await request(framework.app).post('/')
      .send(createMe({ createMe: { ...me, ...{ password: '123123' } } }, fields))

    expect(res.status).toEqual(200)
    expect(res.body).toHaveProperty('data')
    expect(res.body.data).toHaveProperty('createMe')
    expect(res.body.data.createMe).toHaveProperty('id')

    const id = new ObjectId(res.body.data.createMe.id)
    const createdUser = await framework.load<User>(User, id)
    expect(createdUser).toMatchObject(me)
    expect(res.body.data.createMe).toMatchObject({
      id: id.toString(),
      name: createdUser.name,
      createdAt: createdUser.createdAt.getTime(),
      updatedAt: null,
    })
    expect(createdUser.createdAt.getTime()).toBeGreaterThanOrEqual(now)
    expect(res.body.data.createMe).not.toHaveProperty([ 'password', 'creatorId', 'deletedAt' ])
  })
})