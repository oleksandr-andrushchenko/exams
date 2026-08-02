import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Exam ratings', () => {
  test('exam voting is not exposed', async () => {
    const res = await request(framework.app).post('/').send({
      query: 'mutation { rateExam(examId: "000000000000000000000000", mark: 5) { id } }',
    })

    expect([ 200, 400 ]).toContain(res.status)
    expect(res.body.errors).toBeDefined()
  })
})
