import { Inject, Service } from 'typedi'
import Category from '../../entities/category/Category'
import EventSubscriber from '../../decorators/EventSubscriber'
import EventSubscriberInterface from '../../services/event/EventSubscriberInterface'
import CategoryEvent from '../../enums/category/CategoryEvent'
import CategoryActivityCreator from '../../services/category/CategoryActivityCreator'

@Service()
@EventSubscriber(CategoryEvent.Approved)
export default class CategoryApprovedEventSubscriber implements EventSubscriberInterface {

  public constructor(
    @Inject() private readonly categoryActivityCreator: CategoryActivityCreator,
  ) {
  }

  public async handle({ category }: { category: Category }): Promise<void> {
    await this.categoryActivityCreator.createCategoryActivity(category, CategoryEvent.Approved)
  }
}