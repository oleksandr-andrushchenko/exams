import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../src/entities/user/User'
import config from '../../../../src/configuration'
// @ts-ignore
import { getPermission } from '../../graphql/permission/getPermission'
import Permission from '../../../../src/enums/Permission'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Get permission', () => {
  test('Unauthorized', async () => {
    const res = await request(framework.app).post('/')
      .send(getPermission([ 'items', 'hierarchy {regular root}' ]))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('OK', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(getPermission([ 'items', 'hierarchy {regular root}' ]))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toEqual({
      data: {
        permission: {
          items: Object.values(Permission),
          hierarchy: config.auth.permissions,
        },
      },
    })
  })
})