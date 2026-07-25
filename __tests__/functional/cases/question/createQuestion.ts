import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Exam from '../../../../apps/graphql/src/server/entities/exam/Exam'
import User from '../../../../apps/graphql/src/server/entities/user/User'
import { ObjectId } from 'bson'
import Question from '../../../../apps/graphql/src/server/entities/question/Question'
import { faker } from '@faker-js/faker'
import QuestionPermission from '../../../../apps/graphql/src/server/enums/question/QuestionPermission'
// @ts-ignore
import { createQuestion } from '../../graphql/question/createQuestion'
import CreateQuestion from '../../../../apps/graphql/src/server/schema/question/CreateQuestion'
import TestFramework from '../../TestFramework'
import QuestionType from '../../../../apps/graphql/src/server/entities/question/QuestionType'
import QuestionDifficulty from '../../../../apps/graphql/src/server/entities/question/QuestionDifficulty'
import ExamPermission from '../../../../apps/graphql/src/server/enums/exam/ExamPermission'

const framework: TestFramework = globalThis.framework

describe('Create question', () => {
  test('Unauthorized', async () => {
    const exam = await framework.fixture<Exam>(Exam)
    const create = {
      examId: exam.id.toString(),
      title: 'any',
      type: QuestionType.CHOICE,
      choices: [ { title: faker.lorem.sentences(3) }, { title: faker.lorem.sentences(3), correct: true } ],
      difficulty: QuestionDifficulty.EASY,
    }
    const res = await request(framework.app).post('/')
      .send(createQuestion({ createQuestion: create }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Not found (exam)', async () => {
    const examId = await framework.fakeId()
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.Create ] })
    const token = (await framework.auth(user)).token
    const create = {
      examId: examId.toString(),
      title: 'Any valid title',
      type: QuestionType.CHOICE,
      choices: [ { title: faker.lorem.sentences(3) }, { title: faker.lorem.sentences(3), correct: true } ],
      difficulty: QuestionDifficulty.EASY,
    }
    const res = await request(framework.app).post('/')
      .send(createQuestion({ createQuestion: create }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  const createBadRequestBody = (key: keyof CreateQuestion, value: any): Partial<CreateQuestion> => {
    return {
      type: QuestionType.CHOICE,
      difficulty: QuestionDifficulty.EASY,
      title: 'ab c'.repeat(10),
      choices: [ { title: 'a bc'.repeat(10), correct: true }, { title: 'a b c'.repeat(10) } ],
      ...{ [key]: value },
    }
  }
  test.each([
    { case: 'empty body', body: {}, times: 3 },

    { case: 'type as undefined', body: createBadRequestBody('type', undefined) },
    { case: 'type as object', body: createBadRequestBody('type', {}) },
    { case: 'type as number', body: createBadRequestBody('type', 123) },
    { case: 'type as null', body: createBadRequestBody('type', null) },
    { case: 'type as string', body: createBadRequestBody('type', 'any') },
    { case: 'type as boolean', body: createBadRequestBody('type', true) },

    { case: 'difficulty as undefined', body: createBadRequestBody('difficulty', undefined) },
    { case: 'difficulty as object', body: createBadRequestBody('difficulty', {}) },
    { case: 'difficulty as number', body: createBadRequestBody('difficulty', 123) },
    { case: 'difficulty as null', body: createBadRequestBody('difficulty', null) },
    { case: 'difficulty as string', body: createBadRequestBody('difficulty', 'any') },
    { case: 'difficulty as boolean', body: createBadRequestBody('difficulty', true) },

    { case: 'title as undefined', body: createBadRequestBody('title', undefined) },
    { case: 'title as object', body: createBadRequestBody('title', {}) },
    { case: 'title as number', body: createBadRequestBody('title', 123123123) },
    { case: 'title as short string', body: createBadRequestBody('title', 'a') },
    { case: 'title as long string', body: createBadRequestBody('title', 'ab cd'.repeat(999)) },
    { case: 'title as boolean', body: createBadRequestBody('title', true) },

    { case: 'choices as undefined', body: createBadRequestBody('choices', undefined) },
    { case: 'choices as string', body: createBadRequestBody('choices', 'invalid') },
    { case: 'choices as number', body: createBadRequestBody('choices', 123) },
    { case: 'choices as object', body: createBadRequestBody('choices', {}) },
    { case: 'choices as empty array', body: createBadRequestBody('choices', []) },
    { case: 'choices as boolean', body: createBadRequestBody('choices', false) },

    { case: 'choice as undefined', body: createBadRequestBody('choices', undefined) },
    { case: 'choice as string', body: createBadRequestBody('choices', [ 'any' ]) },
    { case: 'choice as number', body: createBadRequestBody('choices', [ 123 ]) },
    { case: 'choice as boolean', body: createBadRequestBody('choices', [ true ]) },
    { case: 'choice as empty object', body: createBadRequestBody('choices', [ {} ]) },
    { case: 'choice title as undefined', body: createBadRequestBody('choices', [ { title: undefined } ]) },
    { case: 'choice title as object', body: createBadRequestBody('choices', [ { title: {} } ]) },
    { case: 'choice title as number', body: createBadRequestBody('choices', [ { title: 123123123123 } ]) },
    { case: 'choice title as short string', body: createBadRequestBody('choices', [ { title: 'a' } ]) },
    { case: 'choice title as long string', body: createBadRequestBody('choices', [ { title: 'a'.repeat(4001) } ]) },
    { case: 'choice title as boolean', body: createBadRequestBody('choices', [ { title: false } ]) },
    {
      case: 'choice correct as object',
      body: createBadRequestBody('choices', [ { title: 'Any valid title', correct: {} } ]),
    },
    {
      case: 'choice correct as number',
      body: createBadRequestBody('choices', [ { title: 'Any valid title', correct: 1 } ]),
    },
    {
      case: 'choice correct as string',
      body: createBadRequestBody('choices', [ { title: 'Any valid title', correct: 'any' } ]),
    },
    {
      case: 'choice correct as null',
      body: createBadRequestBody('choices', [ { title: 'Any valid title', correct: null } ]),
    },
    {
      case: 'choice explanation as object',
      body: createBadRequestBody('choices', [ { title: 'Any valid title', explanation: {} } ]),
    },
    {
      case: 'choice explanation as number',
      body: createBadRequestBody('choices', [ { title: 'Any valid title', explanation: 1 } ]),
    },
    {
      case: 'choice explanation as string',
      body: createBadRequestBody('choices', [ { title: 'Any valid title', explanation: 'any' } ]),
    },
    {
      case: 'choice explanation as null',
      body: createBadRequestBody('choices', [ { title: 'Any valid title', explanation: null } ]),
    },
    {
      case: 'choice explanation as boolean',
      body: createBadRequestBody('choices', [ { title: 'Any valid title', explanation: true } ]),
    },
  ])('Bad request ($case)', async ({ body, times = 1 }) => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.Create ] })
    const token = (await framework.auth(user)).token
    const create = { ...body, ...{ examId: exam.id.toString() } } as CreateQuestion
    const res = await request(framework.app).post('/')
      .send(createQuestion({ createQuestion: create }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError(...Array(times).fill('BadRequestError')))
  })
  test.each([
    { case: 'no permissions', permissions: [] },
    // { case: 'no add exam question permission', permissions: [ QuestionPermission.Create ] },
    // { case: 'no create question permission', permissions: [ ExamPermission.AddQuestion ] },
  ])('Forbidden ($case)', async ({ permissions }) => {
    const exam = await framework.fixture<Exam>(Exam)
    const user = await framework.fixture<User>(User, { permissions })
    const token = (await framework.auth(user)).token
    const create = {
      examId: exam.id.toString(),
      title: faker.lorem.sentences(3),
      type: QuestionType.CHOICE,
      choices: [ { title: faker.lorem.sentences(3) }, { title: faker.lorem.sentences(3), correct: true } ],
      difficulty: QuestionDifficulty.EASY,
    }
    const res = await request(framework.app).post('/')
      .send(createQuestion({ createQuestion: create }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Conflict', async () => {
    const user = await framework.fixture<User>(User)
    const token = (await framework.auth(user)).token
    const exam = await framework.fixture<Exam>(Exam, { ownerId: user.id })
    const question1 = await framework.fixture<Question>(Question)
    const create = {
      examId: exam.id.toString(),
      title: question1.title,
      type: QuestionType.CHOICE,
      choices: [ { title: faker.lorem.sentences(3) }, { title: faker.lorem.sentences(3), correct: true } ],
      difficulty: QuestionDifficulty.EASY,
    }
    const res = await request(framework.app).post('/')
      .send(createQuestion({ createQuestion: create }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ConflictError'))
  })
  test.each([
    { case: 'has exam ownership', ownership: true },
    { case: 'has permission', permission: true },
  ])('Created ($case)', async ({ ownership, permission }) => {
    const user = await framework.fixture<User>(User, permission ? { permissions: [ QuestionPermission.Create, ExamPermission.AddQuestion ] } : {})
    const token = (await framework.auth(user)).token
    const exam = await framework.fixture<Exam>(Exam, ownership ? { ownerId: user.id } : {})
    const create = {
      examId: exam.id.toString(),
      title: faker.lorem.sentences(3),
      type: QuestionType.CHOICE,
      choices: [
        {
          title: faker.lorem.sentence(),
        },
        {
          title: faker.lorem.sentences(3),
          correct: faker.datatype.boolean(),
        },
        {
          title: 'Any title 3',
          explanation: faker.lorem.sentence(),
          correct: faker.datatype.boolean(),
        },
      ],
      difficulty: QuestionDifficulty.EASY,
    }
    const fields = [
      'id',
      'examId',
      'type',
      'difficulty',
      'title',
      'choices {title correct explanation}',
      'rating {markCount averageMark}',
      'ownerId',
      'createdAt',
      'updatedAt',
    ]
    const now = Date.now()
    const res = await request(framework.app).post('/')
      .send(createQuestion({ createQuestion: create }, fields))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { createQuestion: create } })
    expect(res.body.data.createQuestion).toHaveProperty('id')

    const id = new ObjectId(res.body.data.createQuestion.id)
    const createdQuestion = await framework.load<Question>(Question, id)
    expect(createdQuestion).toMatchObject({ ...create, ...{ examId: exam.id } })
    expect(res.body.data.createQuestion).toEqual({
      id: createdQuestion.id.toString(),
      examId: createdQuestion.examId.toString(),
      type: createdQuestion.type,
      difficulty: createdQuestion.difficulty,
      title: createdQuestion.title,
      choices: createdQuestion.choices?.map(choice => ({
        title: choice.title,
        correct: choice.correct === undefined ? null : choice.correct,
        explanation: choice.explanation === undefined ? null : choice.explanation,
      })) ?? null,
      rating: null,
      ownerId: createdQuestion.ownerId.toString(),
      createdAt: createdQuestion.createdAt.getTime(),
      updatedAt: null,
    })
    expect(createdQuestion.createdAt.getTime()).toBeGreaterThanOrEqual(now)
    expect(res.body.data.createQuestion).not.toHaveProperty([ 'creatorId', 'deletedAt' ])
  })
})