import { Inject, Service } from 'typedi'
import Category from '../../entities/category/Category'
import EventSubscriber from '../../decorators/EventSubscriber'
import EventSubscriberInterface from '../../services/event/EventSubscriberInterface'
import CategoryEvent from '../../enums/category/CategoryEvent'
import CategoryActivityCreator from '../../services/category/CategoryActivityCreator'
import User from '../../entities/user/User'
import UserCategoryRatingMarksSyncer from '../../services/user/UserCategoryRatingMarksSyncer'
import CategoryRatingSyncer from '../../services/category/CategoryRatingSyncer'

@Service()
@EventSubscriber(CategoryEvent.Rated)
export default class CategoryRatedEventSubscriber implements EventSubscriberInterface {

  public constructor(
    @Inject() private readonly categoryActivityCreator: CategoryActivityCreator,
    @Inject() private readonly userCategoryRatingMarksSyncer: UserCategoryRatingMarksSyncer,
    @Inject() private readonly categoryRatingSyncer: CategoryRatingSyncer,
  ) {
  }

  public async handle({ category, user }: { category: Category, user: User }): Promise<void> {
    await this.categoryActivityCreator.createCategoryActivity(category, CategoryEvent.Rated)
    await this.userCategoryRatingMarksSyncer.syncUserCategoryRatingMarks(user)
    await this.categoryRatingSyncer.syncCategoryRating(category)
  }
}