import { Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import Category from '../../entities/category/Category'
import Activity from '../../entities/activity/Activity'
import { Event } from '../../enums/Event'

@Service()
export default class CategoryActivityCreator {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
  ) {
  }

  public async createCategoryActivity(category: Category, event: Event): Promise<Activity> {
    const activity = new Activity()
    activity.event = event
    activity.categoryId = category.id
    activity.categoryName = category.name
    activity.createdAt = new Date()

    await this.entityManager.save<Activity>(activity)

    return activity
  }
}