import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../src/entities/user/User'
// @ts-ignore
import { updateMe } from '../../graphql/me/updateMe'
import UpdateMe from '../../../../src/schema/user/UpdateMe'
import TestFramework from '../../TestFramework'
import Permission from '../../../../src/enums/Permission'

const framework: TestFramework = globalThis.framework

describe('Update me', () => {
  test('Unauthorized', async () => {
    const res = await request(framework.app).post('/')
      .send(updateMe({ updateMe: { name: 'any' } }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (empty body)', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(updateMe({} as { updateMe: UpdateMe }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Conflict (email)', async () => {
    const user1 = await framework.fixture<User>(User)
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(updateMe({ updateMe: { email: user1.email } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ConflictError'))
  })
  test('Updated', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ Permission.Root ] })
    const token = (await framework.auth(user)).token
    const update = { name: 'any' }
    const now = Date.now()
    const res = await request(framework.app).post('/')
      .send(updateMe({ updateMe: update }, [ 'id', 'name', 'email', 'permissions', 'createdAt', 'updatedAt' ]))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({
      data: {
        updateMe: {
          ...{
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            permissions: user.permissions,
            createdAt: user.createdAt.getTime(),
          },
          ...update,
        },
      },
    })
    expect(res.body.data.updateMe).toHaveProperty([ 'updatedAt' ])
    expect(res.body.data.updateMe.updatedAt).toBeGreaterThanOrEqual(now)
    expect(res.body.data.updateMe).not.toHaveProperty([ 'password', 'creatorId', 'deletedAt' ])

    const updatedMe = await framework.load<User>(User, user.id)
    expect(updatedMe).toMatchObject(update)

    // check if others remains to be the same
    expect(updatedMe).toMatchObject({
      email: user.email,
      permissions: user.permissions,
      password: user.password,
    })
  })
})