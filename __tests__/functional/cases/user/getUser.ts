import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../apps/graphql/src/server/entities/user/User'
import TestFramework from '../../TestFramework'
import { getUser } from '../../graphql/user/getUser'

const framework: TestFramework = globalThis.framework

describe('Get user', () => {
  test('Public', async () => {
    const user = await framework.fixture<User>(User)
    const res = await request(framework.app).post('/').send(getUser(user.id.toString()))

    expect(res.status).toEqual(200)
    expect(res.body.data.user).toMatchObject({
      id: user.id.toString(),
      name: user.name,
      createdAt: user.createdAt.getTime(),
      updatedAt: user.updatedAt?.getTime() ?? null,
    })
  })

  test('Bad request', async () => {
    const res = await request(framework.app).post('/').send(getUser('invalid'))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })

  test('Not found', async () => {
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/').send(getUser(id.toString()))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
})
