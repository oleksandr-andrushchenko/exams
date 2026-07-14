import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Exam from '../../../../src/entities/exam/Exam'
import User from '../../../../src/entities/user/User'
import Question from '../../../../src/entities/question/Question'
import ExamPermission from '../../../../src/enums/exam/ExamPermission'
// @ts-ignore
import { getExamQuestion } from '../../graphql/exam/getExamQuestion'
import TestFramework from '../../TestFramework'
import QuestionType from '../../../../src/entities/question/QuestionType'

const framework: TestFramework = globalThis.framework

describe('Get exam question', () => {
  test('Unauthorized', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const res = await request(framework.app).post('/')
      .send(getExamQuestion({ examId: exam.id.toString(), question: 0 }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid exam id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Get, ExamPermission.GetQuestion ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(getExamQuestion({ examId: 'invalid', question: 0 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test.each([
    { case: 'invalid question number type', question: 'any' },
    { case: 'negative question number', question: -1 },
  ])('Bad request ($case)', async ({ question }) => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Get, ExamPermission.GetQuestion ] })
    const token = (await framework.auth(user)).token
    const exam = await framework.fixture<Exam>(Exam)
    const res = await request(framework.app).post('/')
      .send(getExamQuestion({ examId: exam.id.toString(), question: question as number }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found (exam)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Get, ExamPermission.GetQuestion ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/')
      .send(getExamQuestion({ examId: id.toString(), question: 0 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Not found (question number)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.load<User>(User, exam.ownerId)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(getExamQuestion({ examId: exam.id.toString(), question: 999 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const exam = await framework.fixture<Exam>(Exam)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(getExamQuestion({ examId: exam.id.toString(), question: 0 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Found (ownership)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.load<User>(User, exam.ownerId)
    const token = (await framework.auth(user)).token
    const questionNumber = exam.questionCount() - 1
    const res = await request(framework.app).post('/')
      .send(getExamQuestion(
        { examId: exam.id.toString(), question: questionNumber },
        [ 'exam {id}', 'question {id title type difficulty}', 'choices', 'number', 'choice', 'answer' ],
      ))
      .auth(token, { type: 'bearer' })

    const examQuestion = exam.questions[questionNumber]
    const question = await framework.load<Question>(Question, examQuestion.questionId)

    expect(res.body).toMatchObject({
      data: {
        examQuestion: {
          exam: {
            id: exam.id.toString(),
          },
          question: {
            title: question.title,
            type: question.type,
            difficulty: question.difficulty,
          },
          number: questionNumber,
        },
      },
    })

    if (question.type === QuestionType.CHOICE) {
      if ('choice' in examQuestion) {
        expect(res.body.data.examQuestion).toHaveProperty('choice')
      }

      expect(res.body.data.examQuestion).toMatchObject({
        choices: question.choices.map(choice => choice.title),
      })
    }

    expect((await framework.load<Exam>(Exam, exam.id)).questionNumber).toEqual(questionNumber)
  })
  test('Found (permission)', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.fixture<User>(User, { permissions: [ ExamPermission.Get, ExamPermission.GetQuestion ] })
    const token = (await framework.auth(user)).token
    const questionNumber = 0
    const res = await request(framework.app).post('/')
      .send(getExamQuestion(
        { examId: exam.id.toString(), question: questionNumber },
        [ 'exam {id}', 'question {id title type difficulty}', 'choices', 'number', 'choice', 'answer' ],
      ))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    const examQuestion = exam.questions[questionNumber]
    const question = await framework.load<Question>(Question, examQuestion.questionId)

    expect(res.body).toMatchObject({
      data: {
        examQuestion: {
          exam: {
            id: exam.id.toString(),
          },
          question: {
            title: question.title,
            type: question.type,
            difficulty: question.difficulty,
          },
          number: questionNumber,
        },
      },
    })

    if (question.type === QuestionType.CHOICE) {
      if ('choice' in examQuestion) {
        expect(res.body.data.examQuestion).toHaveProperty('choice')
      }

      expect(res.body.data.examQuestion).toMatchObject({
        choices: question.choices.map(choice => choice.title),
      })
    }

    expect((await framework.load<Exam>(Exam, exam.id)).questionNumber).toEqual(exam.questionNumber)
  })
})