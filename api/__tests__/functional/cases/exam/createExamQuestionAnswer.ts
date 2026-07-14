import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Exam from '../../../../src/entities/exam/Exam'
import Question from '../../../../src/entities/question/Question'
import User from '../../../../src/entities/user/User'
// @ts-ignore
import { createExamQuestionAnswer } from '../../graphql/exam/createExamQuestionAnswer'
import CreateExamQuestionAnswer from '../../../../src/schema/exam/CreateExamQuestionAnswer'
import ExamPermission from '../../../../src/enums/exam/ExamPermission'
import TestFramework from '../../TestFramework'
import QuestionType from '../../../../src/entities/question/QuestionType'

const framework: TestFramework = globalThis.framework

describe('Create exam question answer', () => {
  test('Unauthorized', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const questionNumber = 0
    const question = await framework.load<Question>(Question, exam.questions[questionNumber].questionId)
    const create = {}

    if (question.type === QuestionType.CHOICE) {
      create['choice'] = 0
    }

    const res = await request(framework.app).post('/')
      .send(createExamQuestionAnswer({
        examId: exam.id.toString(),
        question: questionNumber,
        createExamQuestionAnswer: create,
      }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Not found (exam)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Get, ExamPermission.CreateQuestionAnswer ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const questionNumber = 0
    const res = await request(framework.app).post('/')
      .send(createExamQuestionAnswer({
        examId: id.toString(),
        question: questionNumber,
        createExamQuestionAnswer: { choice: 0 },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Not found (question)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.load<User>(User, exam.ownerId)
    const token = (await framework.auth(user)).token
    const questionNumber = 999
    const res = await request(framework.app).post('/')
      .send(createExamQuestionAnswer({
        examId: exam.id.toString(),
        question: questionNumber,
        createExamQuestionAnswer: { choice: 0 },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Bad request (empty body)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Get, ExamPermission.CreateQuestionAnswer ] })
    const token = (await framework.auth(user)).token
    const exam = await framework.fixture<Exam>(Exam)
    const create = undefined as CreateExamQuestionAnswer
    const res = await request(framework.app).post('/')
      .send(createExamQuestionAnswer({
        examId: exam.id.toString(),
        question: 0,
        createExamQuestionAnswer: create,
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const exam = await framework.fixture<Exam>(Exam)
    const question = await framework.load<Question>(Question, exam.questions[0].questionId)
    const create = {}

    if (question.type === QuestionType.CHOICE) {
      create['choice'] = 0
    }

    const res = await request(framework.app).post('/')
      .send(createExamQuestionAnswer({
        examId: exam.id.toString(),
        question: 0,
        createExamQuestionAnswer: create,
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Created', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.load<User>(User, exam.ownerId)
    const token = (await framework.auth(user)).token
    const questionNumber = 0
    const examQuestion = exam.questions[questionNumber]
    const question = await framework.load<Question>(Question, examQuestion.questionId)
    const create = {}

    if (question.type === QuestionType.CHOICE) {
      create['choice'] = 0
    }

    let answeredQuestionCount = exam.answeredQuestionCount()
    const res = await request(framework.app).post('/')
      .send(createExamQuestionAnswer({
        examId: exam.id.toString(),
        question: questionNumber,
        createExamQuestionAnswer: create,
      }, [ 'exam {id questionNumber answeredQuestionCount}' ]))
      .auth(token, { type: 'bearer' })

    if (typeof examQuestion.choice !== 'number' && typeof examQuestion.answer !== 'string') {
      answeredQuestionCount++
    }

    expect(res.status).toEqual(200)
    expect(res.body.data.createExamQuestionAnswer).toMatchObject({
      exam: {
        id: exam.id.toString(),
        questionNumber: exam.questionNumber,
        answeredQuestionCount,
      },
    })
  })
})