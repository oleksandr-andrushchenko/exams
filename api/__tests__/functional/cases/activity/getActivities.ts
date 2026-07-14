import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Category from '../../../../src/entities/category/Category'
import TestFramework from '../../TestFramework'
// @ts-ignore
import { getActivities } from '../../graphql/activity/getActivities'
import Activity from '../../../../src/entities/activity/Activity'
import CategoryEvent from '../../../../src/enums/category/CategoryEvent'

const framework: TestFramework = globalThis.framework

describe('Get activities', () => {
  test('Empty', async () => {
    await framework.clear(Activity)
    const res = await request(framework.app).post('/').send(getActivities())

    expect(res.status).toEqual(200)
    expect(res.body).toEqual({ data: { activities: [] } })
  })
  test('Not empty', async () => {
    await framework.clear(Activity)
    const category = await framework.fixture<Category>(Category)
    const activities = await Promise.all([
      framework.fixture<Activity>(Activity, { category, event: CategoryEvent.Created }),
      framework.fixture<Activity>(Activity, { category, event: CategoryEvent.Approved }),
    ])
    const fields = [ 'id', 'event', 'categoryId', 'categoryName' ]
    const res = await request(framework.app).post('/')
      .send(getActivities({}, fields))

    expect(res.status).toEqual(200)
    expect(res.body.data.activities).toHaveLength(activities.length)

    const body = res.body.data.activities.sort((a: Activity, b: Activity) => a.id.toString().localeCompare(b.id.toString()))
    activities
      .sort((a: Activity, b: Activity) => a.id.toString().localeCompare(b.id.toString()))
      .forEach((activity: Activity, index: number) => {
        expect(body[index]).toMatchObject({
          id: activity.id.toString(),
          event: activity.event,
          categoryId: activity.categoryId.toString(),
          categoryName: activity.categoryName,
        })
      })
  })
})