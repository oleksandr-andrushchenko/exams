import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Exam from '../../../../src/entities/exam/Exam'
import User from '../../../../src/entities/user/User'
import ExamPermission from '../../../../src/enums/exam/ExamPermission'
// @ts-ignore
import { rateExam } from '../../graphql/exam/rateExam'
import TestFramework from '../../TestFramework'
import Activity from '../../../../src/entities/activity/Activity'
import ExamEvent from '../../../../src/enums/exam/ExamEvent'
import RateExamRequest from '../../../../src/schema/exam/RateExamRequest'
import ExamRatingMark from '../../../../src/entities/exam/ExamRatingMark'

const framework: TestFramework = globalThis.framework

describe('Rate exam', () => {
  test('Unauthorized', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const examId = exam.id.toString()
    const res = await request(framework.app).post('/')
      .send(rateExam({ examId, mark: 1 }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test.each([
    { case: 'no exam', body: {} },
    { case: 'exam is null', body: { examId: null } },
    { case: 'exam is undefined', body: { examId: undefined } },
    { case: 'invalid exam', body: { examId: 'invalid' } },
  ])('Bad request ($case)', async ({ body }) => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Rate ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(rateExam({ ...body, mark: 1 } as RateExamRequest))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test.each([
    { case: 'no mark', body: {} },
    { case: 'mark is null', body: { mark: null } },
    { case: 'mark is undefined', body: { mark: undefined } },
    { case: 'mark is string', body: { mark: 'any' } },
    { case: 'mark is float', body: { mark: 1.1 } },
    { case: 'mark is negative', body: { mark: -1 } },
    { case: 'mark is less then 1', body: { mark: 0 } },
    { case: 'mark is greater 5', body: { mark: 6 } },
  ])('Bad request ($case)', async ({ body }) => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Rate ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(rateExam({ examId: exam.id.toString(), ...body } as RateExamRequest))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Rate ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/')
      .send(rateExam({ examId: id.toString(), mark: 1 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Forbidden (no permission)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [] })
    const exam = await framework.fixture<Exam>(Exam)
    const examId = exam.id.toString()
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(rateExam({ examId, mark: 1 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Rated', async () => {
    await framework.clear()
    const exam = await framework.fixture<Exam>(Exam)
    // existing somebodies exam mark
    const nonUserExamMark = await framework.fixture<ExamRatingMark>(ExamRatingMark, { examId: exam.id })
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Rate ] })
    // existing users non-exam mark
    const userAnyExamRatingMark = await framework.fixture<ExamRatingMark>(ExamRatingMark, {
      creatorId: user.id,
      mark: 3,
    })
    const token = (await framework.auth(user)).token
    const examId = exam.id.toString()
    // new users exam mark
    const mark = 4
    const res = await request(framework.app).post('/')
      .send(rateExam({ examId, mark }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { rateExam: { id: examId } } })

    await framework.sleep(500)

    expect(await framework.repo(ExamRatingMark).countBy({
      examId: exam.id,
      mark,
      creatorId: user.id,
    })).toEqual(1)
    expect(await framework.repo(Activity).countBy({ event: ExamEvent.Rated, examId: exam.id })).toEqual(1)

    const updatedUser = await framework.repo(User).findOneById(user.id) as User
    expect(updatedUser.examRatingMarks[userAnyExamRatingMark.mark - 1][0].toString()).toEqual(userAnyExamRatingMark.examId.toString())
    expect(updatedUser.examRatingMarks[mark - 1][0].toString()).toEqual(exam.id.toString())

    const updatedExam = await framework.repo(Exam).findOneById(exam.id) as Exam
    expect(updatedExam.rating).toBeDefined()
    expect(updatedExam.rating.markCount).toEqual(2)
    expect(updatedExam.rating.averageMark).toEqual((nonUserExamMark.mark + mark) / 2)
  })
})