import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Exam from '../../../../src/entities/exam/Exam'
import ExamTag from '../../../../src/entities/examTag/ExamTag'
import User from '../../../../src/entities/user/User'
import ExamPermission from '../../../../src/enums/exam/ExamPermission'
import TestFramework from '../../TestFramework'
import { createExam } from '../../graphql/exam/createExam'
import { updateExam } from '../../graphql/exam/updateExam'
import { getExams } from '../../graphql/exam/getExams'

const framework: TestFramework = globalThis.framework
const tagFields = [ 'tags { name slug rating examsCount imageFilename }' ]

describe('Exam tags', () => {
  test('Creates, normalizes, reuses, and attaches tags', async () => {
    await framework.clear([ Exam, ExamTag ])
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Create ] })
    const token = (await framework.auth(user)).token

    const first = await request(framework.app).post('/').send(createExam({
      createExam: { name: 'First exam', tags: [ ' JavaScript ', 'Web Development', 'javascript' ] },
    }, tagFields)).auth(token, { type: 'bearer' })
    const second = await request(framework.app).post('/').send(createExam({
      createExam: { name: 'Second exam', tags: [ 'JavaScript' ] },
    }, tagFields)).auth(token, { type: 'bearer' })

    expect(first.body.data.createExam.tags).toEqual([
      expect.objectContaining({ name: 'JavaScript', slug: 'javascript', examsCount: 1 }),
      expect.objectContaining({ name: 'Web Development', slug: 'web-development', examsCount: 1 }),
    ])
    expect(second.body.data.createExam.tags).toEqual([
      expect.objectContaining({ name: 'JavaScript', slug: 'javascript', examsCount: 2 }),
    ])
    expect(await framework.repo(ExamTag).count()).toBe(2)
  })

  test('Replaces tags on update', async () => {
    await framework.clear([ Exam, ExamTag ])
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.load<User>(User, exam.creatorId)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/').send(updateExam({
      examId: exam.id.toString(), updateExam: { tags: [ 'Science' ] },
    }, tagFields)).auth(token, { type: 'bearer' })

    expect(res.body.data.updateExam.tags).toEqual([
      expect.objectContaining({ name: 'Science', slug: 'science', examsCount: 1 }),
    ])
  })

  test('Filters exams by tag slug', async () => {
    await framework.clear([ Exam, ExamTag ])
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Create ] })
    const token = (await framework.auth(user)).token
    const tagged = await request(framework.app).post('/').send(createExam({
      createExam: { name: 'Tagged exam', tags: [ 'TypeScript' ] },
    })).auth(token, { type: 'bearer' })
    await request(framework.app).post('/').send(createExam({
      createExam: { name: 'Other exam', tags: [ 'JavaScript' ] },
    })).auth(token, { type: 'bearer' })

    const res = await request(framework.app).post('/').send(getExams({ tag: 'typescript' }))

    expect(res.body.data.exams).toEqual([ { id: tagged.body.data.createExam.id } ])
  })

  test('Rejects too many tags', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Create ] })
    const token = (await framework.auth(user)).token
    const tags = Array.from({ length: 11 }, (_, index) => `tag-${index}`)
    const res = await request(framework.app).post('/').send(createExam({
      createExam: { name: 'Invalid tags exam', tags },
    })).auth(token, { type: 'bearer' })

    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
})
