import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Category from '../../../../src/entities/category/Category'
import User from '../../../../src/entities/user/User'
import CategoryPermission from '../../../../src/enums/category/CategoryPermission'
// @ts-ignore
import { rateCategory } from '../../graphql/category/rateCategory'
import TestFramework from '../../TestFramework'
import Activity from '../../../../src/entities/activity/Activity'
import CategoryEvent from '../../../../src/enums/category/CategoryEvent'
import RateCategoryRequest from '../../../../src/schema/category/RateCategoryRequest'
import CategoryRatingMark from '../../../../src/entities/category/CategoryRatingMark'

const framework: TestFramework = globalThis.framework

describe('Rate category', () => {
  test('Unauthorized', async () => {
    const category = await framework.fixture<Category>(Category)
    const categoryId = category.id.toString()
    const res = await request(framework.app).post('/')
      .send(rateCategory({ categoryId, mark: 1 }))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('AuthorizationRequiredError'))
  })
  test.each([
    { case: 'no category', body: {} },
    { case: 'category is null', body: { categoryId: null } },
    { case: 'category is undefined', body: { categoryId: undefined } },
    { case: 'invalid category', body: { categoryId: 'invalid' } },
  ])('Bad request ($case)', async ({ body }) => {
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.Rate ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(rateCategory({ ...body, mark: 1 } as RateCategoryRequest))
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
    const category = await framework.fixture<Category>(Category)
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.Rate ] })
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(rateCategory({ categoryId: category.id.toString(), ...body } as RateCategoryRequest))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test('Not found', async () => {
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.Rate ] })
    const token = (await framework.auth(user)).token
    const id = await framework.fakeId()
    const res = await request(framework.app).post('/')
      .send(rateCategory({ categoryId: id.toString(), mark: 1 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('NotFoundError'))
  })
  test('Forbidden (no permission)', async () => {
    const user = await framework.fixture<User>(User, { permissions: [] })
    const category = await framework.fixture<Category>(Category)
    const categoryId = category.id.toString()
    const token = (await framework.auth(user)).token
    const res = await request(framework.app).post('/')
      .send(rateCategory({ categoryId, mark: 1 }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('ForbiddenError'))
  })
  test('Rated', async () => {
    await framework.clear()
    const category = await framework.fixture<Category>(Category)
    // existing somebodies category mark
    const nonUserCategoryMark = await framework.fixture<CategoryRatingMark>(CategoryRatingMark, { categoryId: category.id })
    const user = await framework.fixture<User>(User, { permissions: [ CategoryPermission.Rate ] })
    // existing users non-category mark
    const userAnyCategoryRatingMark = await framework.fixture<CategoryRatingMark>(CategoryRatingMark, {
      creatorId: user.id,
      mark: 3,
    })
    const token = (await framework.auth(user)).token
    const categoryId = category.id.toString()
    // new users category mark
    const mark = 4
    const res = await request(framework.app).post('/')
      .send(rateCategory({ categoryId, mark }))
      .auth(token, { type: 'bearer' })

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject({ data: { rateCategory: { id: categoryId } } })

    await framework.sleep(500)

    expect(await framework.repo(CategoryRatingMark).countBy({
      categoryId: category.id,
      mark,
      creatorId: user.id,
    })).toEqual(1)
    expect(await framework.repo(Activity).countBy({ event: CategoryEvent.Rated, categoryId: category.id })).toEqual(1)

    const updatedUser = await framework.repo(User).findOneById(user.id) as User
    expect(updatedUser.categoryRatingMarks[userAnyCategoryRatingMark.mark - 1][0].toString()).toEqual(userAnyCategoryRatingMark.categoryId.toString())
    expect(updatedUser.categoryRatingMarks[mark - 1][0].toString()).toEqual(category.id.toString())

    const updatedCategory = await framework.repo(Category).findOneById(category.id) as Category
    expect(updatedCategory.rating).toBeDefined()
    expect(updatedCategory.rating.markCount).toEqual(2)
    expect(updatedCategory.rating.averageMark).toEqual((nonUserCategoryMark.mark + mark) / 2)
  })
})