import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import Rating from '../../entities/rating/Rating'
import CategoryRatingMarkRepository from '../../repositories/category/CategoryRatingMarkRepository'
import Category from '../../entities/category/Category'

@Service()
export default class CategoryRatingSyncer {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly categoryRatingMarkRepository: CategoryRatingMarkRepository,
  ) {
  }

  public async syncCategoryRating(category: Category): Promise<Category> {
    const markCount = await this.categoryRatingMarkRepository.countByCategory(category)
    const markSum = await this.categoryRatingMarkRepository.sumByCategory(category)

    category.rating = new Rating()
    category.rating.markCount = markCount
    category.rating.averageMark = markSum / markCount
    category.updatedAt = new Date()

    await this.entityManager.save<Category>(category)

    return category
  }
}