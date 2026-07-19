import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import ExamTag from '../../../../src/entities/examTag/ExamTag'
import TestFramework from '../../TestFramework'
import { getExamTags } from '../../graphql/examTag/getExamTags'

const framework: TestFramework = globalThis.framework

describe('Get exam tags', () => {
  test('Public search', async () => {
    await framework.clear(ExamTag)
    await framework.fixture(ExamTag, { name: 'JavaScript', slug: 'javascript', rating: 7 })
    await framework.fixture(ExamTag, { name: 'History', slug: 'history' })

    const res = await request(framework.app).post('/').send(getExamTags('script'))
    expect(res.status).toEqual(200)
    expect(res.body.data.examTags).toEqual([ expect.objectContaining({
      name: 'JavaScript', slug: 'javascript', rating: 7, examsCount: 0, imageFilename: null,
    }) ])
  })
})
