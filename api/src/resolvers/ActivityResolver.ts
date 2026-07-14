import { Inject, Service } from 'typedi'
import { Args, Query, Resolver } from 'type-graphql'
import Activity from '../entities/activity/Activity'
import ActivityListProvider from '../services/activity/ActivityListProvider'
import PaginatedActivityList from '../schema/activity/PaginatedActivityList'
import ActivityQuery from '../schema/activity/ActivityQuery'

@Service()
@Resolver(Activity)
export class ActivityResolver {

  public constructor(
    @Inject() private readonly activityListProvider: ActivityListProvider,
  ) {
  }

  @Query(_returns => [ Activity ], { name: 'activities' })
  public async getActivities(
    @Args() activityQuery: ActivityQuery,
  ): Promise<Activity[]> {
    return await this.activityListProvider.getActivities(activityQuery, false) as Activity[]
  }

  @Query(_returns => PaginatedActivityList, { name: 'paginatedActivities' })
  public async getPaginatedActivities(
    @Args() activityQuery: ActivityQuery,
  ): Promise<PaginatedActivityList> {
    return await this.activityListProvider.getActivities(activityQuery, true) as PaginatedActivityList
  }
}