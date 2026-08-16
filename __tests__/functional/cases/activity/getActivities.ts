import { describe, expect, test } from '@jest/globals'
import request from 'supertest'
import Exam from '../../../../api-lambda/src/entities/exam/Exam'
import TestFramework from '../../TestFramework'
// @ts-ignore
import { getActivities } from '../../requests/activity/getActivities'
import Activity from '../../../../api-lambda/src/entities/activity/Activity'
import ExamEvent from '../../../../api-lambda/src/enums/exam/ExamEvent'

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
    const exam = await framework.fixture<Exam>(Exam)
    const activities = await Promise.all([
      framework.fixture<Activity>(Activity, { exam, event: ExamEvent.Created }),
      framework.fixture<Activity>(Activity, { exam, event: ExamEvent.Approved })
    ])
    const fields = ['id', 'event', 'examId', 'examName']
    const res = await request(framework.app).post('/').send(getActivities({}, fields))

    expect(res.status).toEqual(200)
    expect(res.body.data.activities).toHaveLength(activities.length)

    const body = res.body.data.activities.sort((a: Activity, b: Activity) =>
      a.id.toString().localeCompare(b.id.toString())
    )
    activities
      .sort((a: Activity, b: Activity) => a.id.toString().localeCompare(b.id.toString()))
      .forEach((activity: Activity, index: number) => {
        expect(body[index]).toMatchObject({
          id: activity.id.toString(),
          event: activity.event,
          examId: activity.examId.toString(),
          examName: activity.examName
        })
      })
  })
})
