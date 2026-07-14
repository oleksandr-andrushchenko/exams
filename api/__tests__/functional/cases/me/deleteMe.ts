import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../src/entities/user/User'
// @ts-ignore
import { deleteMe } from '../../graphql/me/deleteMe'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Delete me', () => {
  test('Unauthorized', async () => {
    const res = await request(framework.app).post('/')
      .send(deleteMe())

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Deleted', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(deleteMe())
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { deleteMe: true } })
    expect(await framework.load<User>(User, user.id)).toBeNull()
  })
})