import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import ExamSession from '../../../../api-lambda/src/server/entities/examSession/ExamSession'
import User from '../../../../api-lambda/src/server/entities/user/User'
import Question from '../../../../api-lambda/src/server/entities/question/Question'
import ExamSessionPermission from '../../../../api-lambda/src/server/enums/examSession/ExamSessionPermission'
// @ts-ignore
import { getExamSessionQuestion } from '../../graphql/examSession/getExamSessionQuestion'
import TestFramework from '../../TestFramework'
import QuestionType from '../../../../api-lambda/src/server/entities/question/QuestionType'

const framework: TestFramework = globalThis.framework

describe('Get examSession question', () => {
  test('Unauthorized', async () => {
    const examSession = await framework.fixture<ExamSession>(ExamSession)
    const res = await request(framework.app)
      .post('/')
      .send(getExamSessionQuestion({ examSessionId: examSession.id.toString(), question: 0 }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid examSession id)', async () => {
    const user = await framework.fixture<User>(User, {
      permissions: [ExamSessionPermission.Get, ExamSessionPermission.GetQuestion]
    })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(getExamSessionQuestion({ examSessionId: 'invalid', question: 0 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test.each([
    { case: 'invalid question number type', question: 'any' },
    { case: 'negative question number', question: -1 }
  ])('Bad request ($case)', async ({ question }) => {
    const user = await framework.fixture<User>(User, {
      permissions: [ExamSessionPermission.Get, ExamSessionPermission.GetQuestion]
    })
    const token = (await framework.auth(user)).token
    const examSession = await framework.fixture<ExamSession>(ExamSession)
    const res = await request(framework.app)
      .post('/')
      .send(getExamSessionQuestion({ examSessionId: examSession.id.toString(), question: question as number }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found (examSession)', async () => {
    const user = await framework.fixture<User>(User, {
      permissions: [ExamSessionPermission.Get, ExamSessionPermission.GetQuestion]
    })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app)
      .post('/')
      .send(getExamSessionQuestion({ examSessionId: id.toString(), question: 0 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Not found (question number)', async () => {
    const examSession = await framework.fixture<ExamSession>(ExamSession)
    const user = await framework.load<User>(User, examSession.ownerId)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(getExamSessionQuestion({ examSessionId: examSession.id.toString(), question: 999 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Forbidden', async () => {
    const user = await framework.fixture<User>(User)
    const examSession = await framework.fixture<ExamSession>(ExamSession)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app)
      .post('/')
      .send(getExamSessionQuestion({ examSessionId: examSession.id.toString(), question: 0 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Found (ownership)', async () => {
    const examSession = await framework.fixture<ExamSession>(ExamSession)
    const user = await framework.load<User>(User, examSession.ownerId)
    const token = (await framework.auth(user)).token
    const questionNumber = examSession.questionCount() - 1
    const res = await request(framework.app)
      .post('/')
      .send(
        getExamSessionQuestion({ examSessionId: examSession.id.toString(), question: questionNumber }, [
          'examSession {id}',
          'question {id title type difficulty}',
          'choices',
          'number',
          'choice',
          'answer'
        ])
      )
      .auth(token, { type: 'bearer' })

    const examSessionQuestion = examSession.questions[questionNumber]
    const question = await framework.load<Question>(Question, examSessionQuestion.questionId)

    expect(res.body).toMatchObject({
      data: {
        examSessionQuestion: {
          examSession: {
            id: examSession.id.toString()
          },
          question: {
            title: question.title,
            type: question.type,
            difficulty: question.difficulty
          },
          number: questionNumber
        }
      }
    })

    if (question.type === QuestionType.CHOICE) {
      if ('choice' in examSessionQuestion) {
        expect(res.body.data.examSessionQuestion).toHaveProperty('choice')
      }

      expect(res.body.data.examSessionQuestion).toMatchObject({
        choices: question.choices.map((choice) => choice.title)
      })
    }

    expect((await framework.load<ExamSession>(ExamSession, examSession.id)).questionNumber).toEqual(questionNumber)
  })
  test('Found (permission)', async () => {
    const examSession = await framework.fixture<ExamSession>(ExamSession)
    const user = await framework.fixture<User>(User, {
      permissions: [ExamSessionPermission.Get, ExamSessionPermission.GetQuestion]
    })
    const token = (await framework.auth(user)).token
    const questionNumber = 0
    const res = await request(framework.app)
      .post('/')
      .send(
        getExamSessionQuestion({ examSessionId: examSession.id.toString(), question: questionNumber }, [
          'examSession {id}',
          'question {id title type difficulty}',
          'choices',
          'number',
          'choice',
          'answer'
        ])
      )
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    const examSessionQuestion = examSession.questions[questionNumber]
    const question = await framework.load<Question>(Question, examSessionQuestion.questionId)

    expect(res.body).toMatchObject({
      data: {
        examSessionQuestion: {
          examSession: {
            id: examSession.id.toString()
          },
          question: {
            title: question.title,
            type: question.type,
            difficulty: question.difficulty
          },
          number: questionNumber
        }
      }
    })

    if (question.type === QuestionType.CHOICE) {
      if ('choice' in examSessionQuestion) {
        expect(res.body.data.examSessionQuestion).toHaveProperty('choice')
      }

      expect(res.body.data.examSessionQuestion).toMatchObject({
        choices: question.choices.map((choice) => choice.title)
      })
    }

    expect((await framework.load<ExamSession>(ExamSession, examSession.id)).questionNumber).toEqual(
      examSession.questionNumber
    )
  })
})
