import { Inject, Service } from 'typedi'
import Activity from '../entities/activity/Activity'
import ActivityListProvider from '../services/activity/ActivityListProvider'
import PaginatedActivityList from '../schema/activity/PaginatedActivityList'
import ActivityQuery from '../schema/activity/ActivityQuery'

@Service()
export class ActivityController {
  public constructor(@Inject() private readonly activityListProvider: ActivityListProvider) {}

  public async getActivities(activityQuery: ActivityQuery): Promise<Activity[]> {
    return (await this.activityListProvider.getActivities(activityQuery, false)) as Activity[]
  }

  public async getPaginatedActivities(activityQuery: ActivityQuery): Promise<PaginatedActivityList> {
    return (await this.activityListProvider.getActivities(activityQuery, true)) as PaginatedActivityList
  }
}
