import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../src/entities/user/User'
// @ts-ignore
import { createAuthenticationToken } from '../../graphql/authenticate/createAuthenticationToken'
import { Credentials } from '../../../../src/schema/auth/Credentials'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Create authentication token', () => {
  test.each([
    { case: 'empty credentials', credentials: {}, times: 2 },
    { case: 'no email', credentials: { password: 'any' } },
    { case: 'email is null', credentials: { email: null, password: 'any' } },
    { case: 'email is undefined', credentials: { email: undefined, password: 'any' } },
    { case: 'email is integer', credentials: { email: 111, password: 'any' } },
    { case: 'email is invalid', credentials: { email: 'invalid', password: 'any' } },
    { case: 'password is null', credentials: { email: 'any@any.com', password: null } },
    { case: 'password is integer', credentials: { email: 'any@any.com', password: 111 } },
    { case: 'password is too short', credentials: { email: 'any@any.com', password: 'a' } },
    { case: 'password is too long', credentials: { email: 'any@any.com', password: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' } },
  ])('Bad request ($case)', async ({ credentials, times = 1 }) => {
    const res = await request(framework.app).post('/')
      .send(createAuthenticationToken({ credentials: credentials as Credentials }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError(...Array(times).fill('BadRequestError')))
  })
  test('Not Found', async () => {
    const credentials = { email: 'any@any.com', password: 'password' }
    const res = await request(framework.app).post('/').send(createAuthenticationToken({ credentials }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const credentials = { email: user.email, password: 'password' }
    const res = await request(framework.app).post('/').send(createAuthenticationToken({ credentials }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Created', async () => {
    const user = await framework.fixture<User>(User, { password: 'password' })
    const credentials = { email: user.email, password: 'password' }
    const res = await request(framework.app).post('/').send(createAuthenticationToken({ credentials }))

    expect(res.status).toEqual(200)
    expect(res.body.data.createAuthenticationToken).toHaveProperty('token')
  })
})