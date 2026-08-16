import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Exam from '../../../../api-lambda/src/entities/exam/Exam'
// @ts-ignore
import { getExam } from '../../requests/exam/getExam'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Get exam', () => {
  test('Not found', async () => {
    const id = await framework.fakeId()
    const variables = { examId: id.toString() }
    const res = await request(framework.app).post('/').send(getExam(variables))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.apiError('NotFoundError'))
  })
  test('Bad request (invalid id)', async () => {
    const variables = { examId: 'invalid' }
    const res = await request(framework.app).post('/').send(getExam(variables))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.apiError('BadRequestError'))
  })
  test('Found', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const fields = [
      'id',
      'name',
      'questionCount',
      'requiredScore',
      'rating {markCount averageMark}',
      'createdAt',
      'updatedAt'
    ]
    const res = await request(framework.app)
      .post('/')
      .send(getExam({ examId: exam.id.toString() }, fields))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({
      data: {
        exam: {
          id: exam.id.toString(),
          name: exam.name,
          questionCount: exam.questionCount,
          requiredScore: exam.requiredScore,
          rating: exam.rating ?? null,
          createdAt: exam.createdAt.getTime(),
          updatedAt: exam.updatedAt?.getTime() ?? null
        }
      }
    })
    expect(res.body.data.exam).not.toHaveProperty('deletedAt')
  })
})
