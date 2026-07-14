import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../src/entities/user/User'
// @ts-ignore
import { updateUser } from '../../graphql/user/updateUser'
import TestFramework from '../../TestFramework'
import UserPermission from '../../../../src/enums/user/UserPermission'
import UpdateUser from '../../../../src/schema/user/UpdateUser'
import { faker } from '@faker-js/faker'
import Permission from '../../../../src/enums/Permission'

const framework: TestFramework = globalThis.framework

describe('Update user', () => {
  test('Unauthorized', async () => {
    const user = await framework.fixture<User>(User)
    const res = await request(framework.app).post('/')
      .send(updateUser({ userId: user.id.toString(), updateUser: { name: 'any' } }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ UserPermission.Update ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(updateUser({ userId: 'invalid', updateUser: { name: 'any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ UserPermission.Update ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/')
      .send(updateUser({ userId: id.toString(), updateUser: { name: 'any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test.each([
    { case: 'name is an object', body: { name: {} } },
    { case: 'name is a number', body: { name: 123123 } },
    { case: 'name is too short', body: { name: 'a' } },
    { case: 'name is too long', body: { name: 'abc'.repeat(99) } },
    { case: 'email is a number', body: { email: 123123 } },
    { case: 'email is an object', body: { email: {} } },
    { case: 'permissions is a string', body: { permissions: 'invalid' } },
    { case: 'permissions is an integer', body: { permissions: 123 } },
    { case: 'permissions is an object', body: { permissions: {} } },
    { case: 'permissions is invalid', body: { permissions: [ 'any' ] } },
  ])('Bad request ($case)', async ({ body }) => {
    const token = (await framework.auth(
      await framework.fixture<User>(User, { permissions: [ UserPermission.Update ] }),
    )).token
    const user = await framework.fixture<User>(User)
    const res = await request(framework.app).post('/')
      .send(updateUser({ userId: user.id.toString(), updateUser: body as UpdateUser }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
    expect(res.body.errors).toHaveLength(1)
  })
  test('Forbidden', async () => {
    const token = (await framework.auth(await framework.fixture<User>(User))).token
    const user = await framework.fixture<User>(User)
    const res = await request(framework.app).post('/')
      .send(updateUser({
        userId: user.id.toString(),
        updateUser: { name: faker.person.fullName() },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Conflict (email)', async () => {
    const user1 = await framework.fixture<User>(User)
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(
      await framework.fixture<User>(User, { permissions: [ UserPermission.Update ] }),
    )).token
    const res = await request(framework.app).post('/')
      .send(updateUser({
        userId: user.id.toString(),
        updateUser: { email: user1.email },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ConflictError'))
  })
  test('Updated (has ownership)', async () => {
    await framework.clear(User)
    const user = await framework.fixture<User>(User, { permissions: [ Permission.Root ] })
    const token = (await framework.auth(user)).token
    const userId = user.id.toString()
    const update = { name: faker.person.fullName() }
    const res = await request(framework.app).post('/')
      .send(updateUser({ userId, updateUser: update }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { updateUser: { id: userId } } })

    const updatedUser = await framework.load<User>(User, user.id)
    expect(updatedUser).toMatchObject(update)

    // check if others remains to be the same
    expect(updatedUser).toMatchObject({
      email: user.email,
      permissions: user.permissions,
      password: user.password,
    })
  })
  test('Updated (has permission)', async () => {
    await framework.clear(User)
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(
      await framework.fixture<User>(User, { permissions: [ UserPermission.Update ] }),
    )).token
    const userId = user.id.toString()
    const update = { name: faker.person.fullName(), email: 'any@gmail.com', permissions: [ Permission.All ] }
    const res = await request(framework.app).post('/')
      .send(updateUser({ userId, updateUser: update }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { updateUser: { id: userId } } })
    expect(await framework.load<User>(User, user.id)).toMatchObject(update)
  })
})