import { Inject, Service } from 'typedi'
import ValidatorInterface from '../validator/ValidatorInterface'
import Cursor from '../../models/Cursor'
import ActivityRepository from '../../repositories/ActivityRepository'
import ActivityQuery from '../../schema/activity/ActivityQuery'
import Activity from '../../entities/activity/Activity'
import PaginatedActivityList from '../../schema/activity/PaginatedActivityList'

@Service()
export default class ActivityListProvider {

  public constructor(
    @Inject() private readonly activityRepository: ActivityRepository,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {ActivityQuery} activityQuery
   * @param {boolean} meta
   * @returns {Promise<Category[] | PaginatedCategories>}
   * @throws {ValidatorError}
   */
  public async getActivities(
    activityQuery: ActivityQuery,
    meta: boolean = false,
  ): Promise<Activity[] | PaginatedActivityList> {
    await this.validator.validate(activityQuery)

    const cursor = new Cursor<Activity>(activityQuery, this.activityRepository)

    return await cursor.getPaginated({ meta })
  }
}