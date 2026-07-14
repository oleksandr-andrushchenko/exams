import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Question from '../../../../src/entities/question/Question'
import User from '../../../../src/entities/user/User'
import { faker } from '@faker-js/faker'
import QuestionPermission from '../../../../src/enums/question/QuestionPermission'
// @ts-ignore
import { updateQuestion } from '../../graphql/question/updateQuestion'
import UpdateQuestion from '../../../../src/schema/question/UpdateQuestion'
import TestFramework from '../../TestFramework'
import QuestionType from '../../../../src/entities/question/QuestionType'
import CategoryPermission from '../../../../src/enums/category/CategoryPermission'
import Category from '../../../../src/entities/category/Category'

const framework: TestFramework = globalThis.framework

describe('Update question', () => {
  test('Unauthorized', async () => {
    const question = await framework.fixture<Question>(Question)
    const res = await request(framework.app).post('/')
      .send(updateQuestion({ questionId: question.id.toString(), updateQuestion: { title: 'any' } }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test('Bad request (invalid question id)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.Update ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(updateQuestion({ questionId: 'invalid', updateQuestion: { title: 'any' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found (question)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.Update ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/')
      .send(updateQuestion({ questionId: id.toString(), updateQuestion: { title: 'any valid title' } }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Not found (category)', async () => {
    const categoryId = await framework.fakeId()
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.Update ] })
    const token = (await framework.auth(user)).token
    const question = await framework.fixture<Question>(Question, { type: QuestionType.CHOICE })
    const res = await request(framework.app).post('/')
      .send(updateQuestion({
        questionId: question.id.toString(),
        updateQuestion: { categoryId: categoryId.toString() },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test.each([
    { case: 'category id as object', body: { categoryId: {} } },
    { case: 'category id as number', body: { categoryId: 123 } },
    { case: 'category id as null', body: { categoryId: null } },
    { case: 'category id as string', body: { categoryId: 'f656d857000000000000000' } },
    { case: 'category id as invalid mongo id', body: { categoryId: 'zzzzzzzzzzzzzzzzzzzzzzzz' } },
    { case: 'category id as boolean', body: { categoryId: false } },

    { case: 'type as object', body: { type: {} } },
    { case: 'type as number', body: { type: 123 } },
    { case: 'type as null', body: { type: null } },
    { case: 'type as string', body: { type: 'any' } },
    { case: 'type as boolean', body: { type: true } },

    { case: 'difficulty as object', body: { difficulty: {} } },
    { case: 'difficulty as number', body: { difficulty: 123 } },
    { case: 'difficulty as null', body: { difficulty: null } },
    { case: 'difficulty as string', body: { difficulty: 'any' } },
    { case: 'difficulty as boolean', body: { difficulty: false } },

    { case: 'title as object', body: { title: {} } },
    { case: 'title as number', body: { title: 123123 } },
    { case: 'title as short string', body: { title: 'a' } },
    { case: 'title as long string', body: { title: 'ab cd'.repeat(999) } },
    { case: 'title as boolean', body: { title: true } },

    { case: 'choices as string', body: { choices: 'invalid' } },
    { case: 'choices as number', body: { choices: 123 } },
    { case: 'choices as object', body: { choices: {} } },
    { case: 'choices as empty array', body: { choices: [] } },
    { case: 'choices as boolean', body: { choices: false } },

    { case: 'choice as string', body: { choices: [ 'any' ] } },
    { case: 'choice as number', body: { choices: [ 123 ] } },
    { case: 'choice as boolean', body: { choices: [ true ] } },
    { case: 'choice as empty object', body: { choices: [ {} ] } },
    { case: 'choice title as object', body: { choices: [ { title: {} } ] } },
    { case: 'choice title as number', body: { choices: [ { title: 123123123123 } ] } },
    { case: 'choice title as short string', body: { choices: [ { title: 'a' } ] } },
    { case: 'choice title as long string', body: { choices: [ { title: 'ab cd e'.repeat(999) } ] } },
    { case: 'choice title as boolean', body: { choices: [ { title: false } ] } },
    { case: 'choice correct as object', body: { choices: [ { title: 'Any valid title', correct: {} } ] } },
    { case: 'choice correct as number', body: { choices: [ { title: 'Any valid title', correct: 1 } ] } },
    { case: 'choice correct as string', body: { choices: [ { title: 'Any valid title', correct: 'any' } ] } },
    { case: 'choice correct as null', body: { choices: [ { title: 'Any valid title', correct: null } ] } },
    { case: 'choice explanation as object', body: { choices: [ { title: 'Any valid title', explanation: {} } ] } },
    { case: 'choice explanation as number', body: { choices: [ { title: 'Any valid title', explanation: 1 } ] } },
    { case: 'choice explanation as string', body: { choices: [ { title: 'Any valid title', explanation: 'any' } ] } },
    { case: 'choice explanation as null', body: { choices: [ { title: 'Any valid title', explanation: null } ] } },
    { case: 'choice explanation as boolean', body: { choices: [ { title: 'Any valid title', explanation: true } ] } },
  ])('Bad request ($case)', async ({ body }) => {
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.Update ] })
    const token = (await framework.auth(user)).token
    const question = await framework.fixture<Question>(Question, { type: QuestionType.CHOICE })
    const res = await request(framework.app).post('/')
      .send(updateQuestion({
        questionId: question.id.toString(),
        updateQuestion: body as UpdateQuestion,
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test.each([
    { case: 'no permissions', permissions: [] },
    // { case: 'no add category question permission', permissions: [ QuestionPermission.Update ] },
    // { case: 'no update question permission', permissions: [ CategoryPermission.AddQuestion ] },
  ])('Forbidden ($case)', async ({ permissions }) => {
    const user = await framework.fixture<User>(User, { permissions })
    const question = await framework.fixture<Question>(Question)
    const category = await framework.fixture<Category>(Category)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(updateQuestion({
        questionId: question.id.toString(),
        updateQuestion: { categoryId: category.id.toString() },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Conflict', async () => {
    const question1 = await framework.fixture<Question>(Question)
    const question = await framework.fixture<Question>(Question, { permissions: [ QuestionPermission.Update ] })
    const user = await framework.load<User>(User, question.creatorId)
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(updateQuestion({
        questionId: question.id.toString(),
        updateQuestion: { title: question1.title },
      }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ConflictError'))
  })
  test('Updated (has ownership)', async () => {
    await framework.clear(Question)
    const question = await framework.fixture<Question>(Question)
    const user = await framework.load<User>(User, question.creatorId)
    const token = (await framework.auth(user)).token
    const questionId = question.id.toString()
    const update = { title: faker.lorem.sentences(3) }
    const res = await request(framework.app).post('/')
      .send(updateQuestion({ questionId, updateQuestion: update }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { updateQuestion: { id: questionId } } })

    const updatedQuestion = await framework.load<Question>(Question, question.id)
    expect(updatedQuestion).toMatchObject(update)
  })
  test('Updated (has permission)', async () => {
    await framework.clear(Question)
    const question = await framework.fixture<Question>(Question)
    const user = await framework.fixture<User>(User, { permissions: [ QuestionPermission.Update ] })
    const token = (await framework.auth(user)).token
    const questionId = question.id.toString()
    const update = { title: faker.lorem.sentences(3) }
    const res = await request(framework.app).post('/')
      .send(updateQuestion({ questionId, updateQuestion: update }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { updateQuestion: { id: questionId } } })

    const updatedQuestion = await framework.load<Question>(Question, question.id)
    expect(updatedQuestion).toMatchObject(update)

    // check if others remains to be the same
    expect(updatedQuestion).toMatchObject({
      categoryId: question.categoryId,
      type: question.type,
      difficulty: question.difficulty,
      choices: question.choices,
    })
  })
})