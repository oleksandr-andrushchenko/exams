import { Inject, Service } from 'typedi'
import Activity from '../../../shared/src/entities/activity/Activity'
import ActivityListProvider from '../../../shared/src/services/activity/ActivityListProvider'
import PaginatedActivityList from '../../../shared/src/schema/activity/PaginatedActivityList'
import ActivityQuery from '../../../shared/src/schema/activity/ActivityQuery'
import { type Request, type Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { queryObject } from '../../../shared/src/http'

@Service()
export class ActivityController {
  public constructor(@Inject() private readonly activityListProvider: ActivityListProvider) {}

  public async getActivities(activityQuery: ActivityQuery): Promise<Activity[]> {
    return (await this.activityListProvider.getActivities(activityQuery, false)) as Activity[]
  }

  public async getPaginatedActivities(activityQuery: ActivityQuery): Promise<PaginatedActivityList> {
    return (await this.activityListProvider.getActivities(activityQuery, true)) as PaginatedActivityList
  }
  public async route(request: Request, response: Response): Promise<void> {
    response.json(await this.getActivities(plainToInstance(ActivityQuery, queryObject(request.query))))
  }
}
