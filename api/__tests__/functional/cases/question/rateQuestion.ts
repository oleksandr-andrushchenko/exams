import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import User from '../../../../src/entities/user/User'
import QuestionPermission from '../../../../src/enums/question/QuestionPermission'
// @ts-ignore
import { rateQuestion } from '../../graphql/question/rateQuestion'
import TestFramework from '../../TestFramework'
import QuestionRatingMark from '../../../../src/entities/question/QuestionRatingMark'
import Question from '../../../../src/entities/question/Question'
import RateQuestionRequest from '../../../../src/schema/question/RateQuestionRequest'

const framework: TestFramework = globalThis.framework

describe('Rate question', () => {
  test('Unauthorized', async () => {
    const question = await framework.fixture<Question>(Question)
    const questionId = question.id.toString()
    const res = await request(framework.app).post('/')
      .send(rateQuestion({ questionId, mark: 1 }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test.each([
    { case: 'no question', body: {} },
    { case: 'question is null', body: { questionId: null } },
    { case: 'question is undefined', body: { questionId: undefined } },
    { case: 'invalid question', body: { questionId: 'invalid' } },
  ])('Bad request ($case)', async ({ body }) => {
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.Rate ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(rateQuestion({ ...body, mark: 1 } as RateQuestionRequest))
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
    const question = await framework.fixture<Question>(Question)
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.Rate ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(rateQuestion({ questionId: question.id.toString(), ...body } as RateQuestionRequest))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.Rate ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/')
      .send(rateQuestion({ questionId: id.toString(), mark: 1 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Forbidden (no permission)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [] })
    const question = await framework.fixture<Question>(Question)
    const questionId = question.id.toString()
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(rateQuestion({ questionId, mark: 1 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Rated', async () => {
    await framework.clear([ QuestionRatingMark, Question ])
    const question = await framework.fixture<Question>(Question)
    // existing somebodies question mark
    const nonUserQuestionMark = await framework.fixture<QuestionRatingMark>(QuestionRatingMark, { questionId: question.id })
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.Rate ] })
    // existing users non-question mark
    const userAnyQuestionRatingMark = await framework.fixture<QuestionRatingMark>(QuestionRatingMark, {
      creatorId: user.id,
      mark: 3,
    })
    const token = (await framework.auth(user)).token
    const questionId = question.id.toString()
    // new users question mark
    const mark = 4
    const res = await request(framework.app).post('/')
      .send(rateQuestion({ questionId, mark }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { rateQuestion: { id: questionId } } })

    await framework.sleep(500)

    expect(await framework.repo(QuestionRatingMark).countBy({
      questionId: question.id,
      mark,
      creatorId: user.id,
    })).toEqual(1)

    const updatedUser = await framework.repo(User).findOneById(user.id) as User
    expect(updatedUser.questionRatingMarks[userAnyQuestionRatingMark.mark - 1][0].toString()).toEqual(userAnyQuestionRatingMark.questionId.toString())
    expect(updatedUser.questionRatingMarks[mark - 1][0].toString()).toEqual(question.id.toString())

    const updatedQuestion = await framework.repo(Question).findOneById(question.id) as Question
    expect(updatedQuestion.rating).toBeDefined()
    expect(updatedQuestion.rating.markCount).toEqual(2)
    expect(updatedQuestion.rating.averageMark).toEqual((nonUserQuestionMark.mark + mark) / 2)
  })
})