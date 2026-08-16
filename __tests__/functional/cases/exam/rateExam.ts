import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Exam ratings', () => {
  test('exam voting is not exposed', async () => {
    const res = await request(framework.app)
      .post('/')
      .send({ method: 'POST', path: '/exams/000000000000000000000000/rating', body: { mark: 5 }, field: 'rateExam' })

    expect(res.status).toEqual(200)
    expect(res.body.errors).toBeDefined()
  })
})
