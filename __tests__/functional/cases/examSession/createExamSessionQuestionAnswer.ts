import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import ExamSession from '../../../../src/server/entities/examSession/ExamSession'
import Question from '../../../../src/server/entities/question/Question'
import User from '../../../../src/server/entities/user/User'
// @ts-ignore
import { createExamSessionQuestionAnswer } from '../../graphql/examSession/createExamSessionQuestionAnswer'
import CreateExamSessionQuestionAnswer from '../../../../src/server/schema/examSession/CreateExamSessionQuestionAnswer'
import ExamSessionPermission from '../../../../src/server/enums/examSession/ExamSessionPermission'
import TestFramework from '../../TestFramework'
import QuestionType from '../../../../src/server/entities/question/QuestionType'

const framework: TestFramework = globalThis.framework

describe('Create examSession question answer', () => {
  test('Unauthorized', async () => {
    const examSession = await framework.fixture<ExamSession>(ExamSession)
    const questionNumber = 0
    const question = await framework.load<Question>(Question, examSession.questions[questionNumber].questionId)
    const create = {}

    if (question.type === QuestionType.CHOICE) {
      create['choice'] = 0
    }

    const res = await request(framework.app).post('/')
      .send(createExamSessionQuestionAnswer({
        examSessionId: examSession.id.toString(),
        question: questionNumber,
        createExamSessionQuestionAnswer: create,
      }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Not found (examSession)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamSessionPermission.Get, ExamSessionPermission.CreateQuestionAnswer ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const questionNumber = 0
    const res = await request(framework.app).post('/')
      .send(createExamSessionQuestionAnswer({
        examSessionId: id.toString(),
        question: questionNumber,
        createExamSessionQuestionAnswer: { choice: 0 },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Not found (question)', async () => {
    const examSession = await framework.fixture<ExamSession>(ExamSession)
    const user = await framework.load<User>(User, examSession.ownerId)
    const token = (await framework.auth(user)).token
    const questionNumber = 999
    const res = await request(framework.app).post('/')
      .send(createExamSessionQuestionAnswer({
        examSessionId: examSession.id.toString(),
        question: questionNumber,
        createExamSessionQuestionAnswer: { choice: 0 },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Bad request (empty body)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamSessionPermission.Get, ExamSessionPermission.CreateQuestionAnswer ] })
    const token = (await framework.auth(user)).token
    const examSession = await framework.fixture<ExamSession>(ExamSession)
    const create = undefined as CreateExamSessionQuestionAnswer
    const res = await request(framework.app).post('/')
      .send(createExamSessionQuestionAnswer({
        examSessionId: examSession.id.toString(),
        question: 0,
        createExamSessionQuestionAnswer: create,
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const examSession = await framework.fixture<ExamSession>(ExamSession)
    const question = await framework.load<Question>(Question, examSession.questions[0].questionId)
    const create = {}

    if (question.type === QuestionType.CHOICE) {
      create['choice'] = 0
    }

    const res = await request(framework.app).post('/')
      .send(createExamSessionQuestionAnswer({
        examSessionId: examSession.id.toString(),
        question: 0,
        createExamSessionQuestionAnswer: create,
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Created', async () => {
    const examSession = await framework.fixture<ExamSession>(ExamSession)
    const user = await framework.load<User>(User, examSession.ownerId)
    const token = (await framework.auth(user)).token
    const questionNumber = 0
    const examSessionQuestion = examSession.questions[questionNumber]
    const question = await framework.load<Question>(Question, examSessionQuestion.questionId)
    const create = {}

    if (question.type === QuestionType.CHOICE) {
      create['choice'] = 0
    }

    let answeredQuestionCount = examSession.answeredQuestionCount()
    const res = await request(framework.app).post('/')
      .send(createExamSessionQuestionAnswer({
        examSessionId: examSession.id.toString(),
        question: questionNumber,
        createExamSessionQuestionAnswer: create,
      }, [ 'examSession {id questionNumber answeredQuestionCount}' ]))
      .auth(token, { type: 'bearer' })

    if (typeof examSessionQuestion.choice !== 'number' && typeof examSessionQuestion.answer !== 'string') {
      answeredQuestionCount++
    }

    expect(res.status).toEqual(200)
    expect(res.body.data.createExamSessionQuestionAnswer).toMatchObject({
      examSession: {
        id: examSession.id.toString(),
        questionNumber: examSession.questionNumber,
        answeredQuestionCount,
      },
    })
  })
})