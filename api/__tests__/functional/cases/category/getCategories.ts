import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Category from '../../../../src/entities/category/Category'
// @ts-ignore
import { getCategories } from '../../graphql/category/getCategories'
import GetCategories from '../../../../src/schema/category/GetCategories'
import TestFramework from '../../TestFramework'

const framework: TestFramework = globalThis.framework

describe('Get categories', () => {
  test('Empty', async () => {
    await framework.clear(Category)
    const res = await request(framework.app).post('/').send(getCategories())

    expect(res.status).toEqual(200)
    expect(res.body).toEqual({ data: { categories: [] } })
  })
  test.each([
    { case: 'invalid subscription', query: { subscription: 'any' } },
    { case: 'invalid approved', query: { approved: 'any' } },
    { case: 'invalid cursor type', query: { cursor: 1 } },
    { case: 'not allowed cursor', query: { cursor: 'name' } },
    { case: 'invalid size type', query: { size: 'any' } },
    { case: 'negative size', query: { size: -1 } },
    { case: 'zero size', query: { size: 0 } },
    { case: 'size greater them max', query: { size: 1000 } },
    { case: 'invalid order type', query: { order: 1 } },
    { case: 'not allowed order', query: { order: 'any' } },
  ])('Bad request ($case)', async ({ query }) => {
    const res = await request(framework.app).post('/').send(getCategories(query as GetCategories))

    expect(res.status).toEqual(200)
    expect(res.body).toMatchObject(framework.graphqlError('BadRequestError'))
  })
  test.each([
    { size: 1 },
    { size: 2 },
    { size: 3 },
    { size: 4 },
  ])('Cursor (id, id:asc, size: $size)', async ({ size }) => {
    await framework.clear(Category)
    const categories = (await Promise.all([
      framework.fixture<Category>(Category),
      framework.fixture<Category>(Category),
      framework.fixture<Category>(Category),
    ])).sort((a: Category, b: Category) => a.id.toString().localeCompare(b.id.toString()))

    const query = { cursor: 'id', size, order: 'asc' }
    const res = await request(framework.app).post('/').send(getCategories(query as GetCategories))

    expect(res.status).toEqual(200)
    const firstInStoragePosition = 0
    const lastInStoragePosition = Math.min(categories.length, size) - 1
    expect(res.body.data.categories).toHaveLength(lastInStoragePosition - firstInStoragePosition + 1)

    const firstInBodyId = res.body.data.categories[0].id
    const firstInStorageId = categories[firstInStoragePosition].id.toString()
    expect(firstInBodyId).toEqual(firstInStorageId)
    const lastInBodyId = res.body.data.categories[res.body.data.categories.length - 1].id
    const lastInStorageId = categories[lastInStoragePosition].id.toString()
    expect(lastInBodyId).toEqual(lastInStorageId)
  })
  test.each([
    { size: 1 },
    { size: 2 },
    { size: 3 },
    { size: 4 },
  ])('Cursor (id, id:desc, size: $size)', async ({ size }) => {
    await framework.clear(Category)
    const categories = (await Promise.all([
      framework.fixture<Category>(Category),
      framework.fixture<Category>(Category),
      framework.fixture<Category>(Category),
    ])).sort((a: Category, b: Category) => a.id.toString().localeCompare(b.id.toString()))

    const query = { cursor: 'id', size, order: 'desc' }
    const res = await request(framework.app).post('/').send(getCategories(query as GetCategories))

    expect(res.status).toEqual(200)

    if (categories.length < 1) {
      expect(res.body.data.categories).toHaveLength(0)
      return
    }

    const firstInStoragePosition = Math.max(0, categories.length - size)
    const lastInStoragePosition = Math.max(0, categories.length - 1)
    expect(res.body.data.categories).toHaveLength(lastInStoragePosition - firstInStoragePosition + 1)

    const firstInBodyId = res.body.data.categories[0].id
    const lastInStorageId = categories[lastInStoragePosition].id.toString()
    expect(firstInBodyId).toEqual(lastInStorageId)
    const firstInStorageId = categories[firstInStoragePosition].id.toString()
    const lastInBodyId = res.body.data.categories[res.body.data.categories.length - 1].id
    expect(lastInBodyId).toEqual(firstInStorageId)
  })
  test.each([
    { prev: 0, size: 1 },
    { prev: 0, size: 2 },
    { prev: 1, size: 1 },
    { prev: 1, size: 2 },
    { prev: 1, size: 3 },
    { prev: 1, size: 4 },
    { prev: 2, size: 1 },
    { prev: 2, size: 2 },
    { prev: 2, size: 3 },
  ])('Cursor (id, id:asc, prev: $prev, size: $size)', async ({ prev, size }) => {
    await framework.clear(Category)
    const categories = (await Promise.all([
      framework.fixture<Category>(Category),
      framework.fixture<Category>(Category),
      framework.fixture<Category>(Category),
    ])).sort((a: Category, b: Category) => a.id.toString().localeCompare(b.id.toString()))

    const prevCursor = categories[prev].id.toString()
    const query = { cursor: 'id', size, order: 'asc' }
    const res = await request(framework.app).post('/')
      .send(getCategories({ ...query, ...{ prevCursor } } as GetCategories))

    expect(res.status).toEqual(200)

    if (prev < 1) {
      expect(res.body.data.categories).toHaveLength(0)
      return
    }

    const firstInStoragePosition = Math.max(0, prev - size)
    const lastInStoragePosition = Math.max(0, prev - 1)
    expect(res.body.data.categories).toHaveLength(lastInStoragePosition - firstInStoragePosition + 1)

    const firstInBodyId = res.body.data.categories[0].id
    const firstInStorageId = categories[firstInStoragePosition].id.toString()
    expect(firstInBodyId).toEqual(firstInStorageId)
    const lastInBodyId = res.body.data.categories[res.body.data.categories.length - 1].id
    const lastInStorageId = categories[lastInStoragePosition].id.toString()
    expect(lastInBodyId).toEqual(lastInStorageId)
  })
  test.each([
    { next: 0, size: 1 },
    { next: 0, size: 2 },
    { next: 0, size: 3 },
    { next: 1, size: 1 },
    { next: 1, size: 2 },
    { next: 1, size: 3 },
    { next: 2, size: 1 },
    { next: 2, size: 2 },
    { next: 2, size: 3 },
  ])('Cursor (id, id:asc, next: $next, size: $size)', async ({ next, size }) => {
    await framework.clear(Category)
    const categories = (await Promise.all([
      framework.fixture<Category>(Category),
      framework.fixture<Category>(Category),
      framework.fixture<Category>(Category),
    ])).sort((a: Category, b: Category) => a.id.toString().localeCompare(b.id.toString()))

    const nextCursor = categories[next].id.toString()
    const query = { cursor: 'id', size, order: 'asc' }
    const res = await request(framework.app).post('/')
      .send(getCategories({ ...query, ...{ nextCursor } } as GetCategories))

    expect(res.status).toEqual(200)

    if (next + 1 > categories.length - 1) {
      expect(res.body.data.categories).toHaveLength(0)
      return
    }

    const firstInStoragePosition = Math.min(next + 1, categories.length - 1)
    const lastInStoragePosition = Math.min(next + size, categories.length - 1)
    expect(res.body.data.categories).toHaveLength(lastInStoragePosition - firstInStoragePosition + 1)

    const firstInBodyId = res.body.data.categories[0].id
    const firstInStorageId = categories[firstInStoragePosition].id.toString()
    expect(firstInBodyId).toEqual(firstInStorageId)
    const lastInBodyId = res.body.data.categories[res.body.data.categories.length - 1].id
    const lastInStorageId = categories[lastInStoragePosition].id.toString()
    expect(lastInBodyId).toEqual(lastInStorageId)
  })
  test.each([
    { prev: 0, size: 1 },
    { prev: 0, size: 2 },
    { prev: 0, size: 3 },
    { prev: 0, size: 4 },
    { prev: 1, size: 1 },
    { prev: 1, size: 2 },
    { prev: 1, size: 3 },
    { prev: 1, size: 4 },
    { prev: 2, size: 1 },
    { prev: 2, size: 2 },
    { prev: 2, size: 3 },
    { prev: 2, size: 4 },
  ])('Cursor (id, id:desc, prev: $prev, size: $size)', async ({ prev, size }) => {
    await framework.clear(Category)
    const categories = (await Promise.all([
      framework.fixture<Category>(Category),
      framework.fixture<Category>(Category),
      framework.fixture<Category>(Category),
    ])).sort((a: Category, b: Category) => a.id.toString().localeCompare(b.id.toString()))

    const prevCursor = categories[prev].id.toString()
    const query = { cursor: 'id', size, order: 'desc' }
    const res = await request(framework.app).post('/')
      .send(getCategories({ ...query, ...{ prevCursor } } as GetCategories))

    expect(res.status).toEqual(200)

    if (prev + 2 > categories.length) {
      expect(res.body.data.categories).toHaveLength(0)
      return
    }

    const firstInStoragePosition = Math.min(prev + 1, categories.length - 1)
    const lastInStoragePosition = Math.min(prev + size, categories.length - 1)
    expect(res.body.data.categories).toHaveLength(lastInStoragePosition - firstInStoragePosition + 1)

    const firstInBodyId = res.body.data.categories[0].id
    const lastInStorageId = categories[lastInStoragePosition].id.toString()
    expect(firstInBodyId).toEqual(lastInStorageId)
    const lastInBodyId = res.body.data.categories[res.body.data.categories.length - 1].id
    const firstInStorageId = categories[firstInStoragePosition].id.toString()
    expect(lastInBodyId).toEqual(firstInStorageId)
  })
  test.each([
    { next: 0, size: 1 },
    { next: 0, size: 2 },
    { next: 0, size: 3 },
    { next: 1, size: 1 },
    { next: 1, size: 2 },
    { next: 1, size: 3 },
    { next: 2, size: 1 },
    { next: 2, size: 2 },
    { next: 2, size: 3 },
  ])('Cursor (id, id:desc, next: $next, size: $size)', async ({ next, size }) => {
    await framework.clear(Category)
    const categories = (await Promise.all([
      framework.fixture<Category>(Category),
      framework.fixture<Category>(Category),
      framework.fixture<Category>(Category),
    ])).sort((a: Category, b: Category) => a.id.toString().localeCompare(b.id.toString()))

    const nextCursor = categories[next].id.toString()
    const query = { cursor: 'id', size, order: 'desc' }
    const res = await request(framework.app).post('/')
      .send(getCategories({ ...query, ...{ nextCursor } } as GetCategories))

    expect(res.status).toEqual(200)

    if (next < 1) {
      expect(res.body.data.categories).toHaveLength(0)
      return
    }

    const firstInStoragePosition = Math.max(0, next - 1)
    const lastInStoragePosition = Math.max(0, next - size)
    expect(res.body.data.categories).toHaveLength(firstInStoragePosition - lastInStoragePosition + 1)

    const firstInBodyId = res.body.data.categories[0].id
    const firstInStorageId = categories[firstInStoragePosition].id.toString()
    expect(firstInBodyId).toEqual(firstInStorageId)
    const lastInBodyId = res.body.data.categories[res.body.data.categories.length - 1].id
    const lastInStorageId = categories[lastInStoragePosition].id.toString()
    expect(lastInBodyId).toEqual(lastInStorageId)
  })
  test('Not empty', async () => {
    await framework.clear(Category)
    const categories = await Promise.all([
      framework.fixture<Category>(Category),
      framework.fixture<Category>(Category),
    ])

    const res = await request(framework.app).post('/').send(getCategories({ size: 50 }, [ 'id', 'name' ]))

    expect(res.status).toEqual(200)
    expect(res.body.data.categories).toHaveLength(categories.length)
    const body = res.body.data.categories.sort((a, b) => a.name.localeCompare(b.name))
    categories.sort((a, b) => a.name.localeCompare(b.name)).forEach((category, index) => {
      expect(body[index]).toMatchObject({ name: category.name })
    })
  })
})