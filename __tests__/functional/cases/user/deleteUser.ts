import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../api-lambda/src/entities/user/User'
import UserPermission from '../../../../api-lambda/src/enums/user/UserPermission'
// @ts-ignore
import { deleteUser } from '../../requests/user/deleteUser'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Delete user', () => {
  test('Unauthorized', async () => {
    const user = await framework.fixture<User>(User)
    const res = await request(framework.app)
      .post('/')
      .send(deleteUser({ userId: user.id.toString() }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.apiError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [UserPermission.Delete] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(deleteUser({ userId: 'invalid' }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.apiError('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, { permissions: [UserPermission.Delete] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app)
      .post('/')
      .send(deleteUser({ userId: id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.apiError('NotFoundError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(await framework.fixture<User>(User))).token
    const res = await request(framework.app)
      .post('/')
      .send(deleteUser({ userId: user.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.apiError('ForbiddenError'))
  })
  test('Deleted (has ownership)', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(deleteUser({ userId: user.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { deleteUser: true } })
    expect(await framework.load<User>(User, user.id)).toBeNull()
  })
  test('Deleted (has permission)', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(await framework.fixture<User>(User, { permissions: [UserPermission.Delete] })))
      .token
    const res = await request(framework.app)
      .post('/')
      .send(deleteUser({ userId: user.id.toString() }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { deleteUser: true } })
    expect(await framework.load<User>(User, user.id)).toBeNull()
  })
})
