import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import Category from '../../entities/category/Category'
import CategoryPermission from '../../enums/category/CategoryPermission'
import EventDispatcher from '../event/EventDispatcher'
import CategoryEvent from '../../enums/category/CategoryEvent'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import CategoryRatedAlready from '../../errors/category/CategoryRatedAlready'
import CategoryRatingMarkRepository from '../../repositories/category/CategoryRatingMarkRepository'
import CategoryRatingMark from '../../entities/category/CategoryRatingMark'

@Service()
export default class CategoryRatingMarkCreator {

  public constructor(
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject() private readonly categoryRatingMarkRepository: CategoryRatingMarkRepository,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
  ) {
  }

  /**
   * @param {Category} category
   * @param {number} mark
   * @param {User} initiator
   * @returns {Promise<Category>}
   * @throws {AuthorizationFailedError}
   */
  public async createCategoryRatingMark(category: Category, mark: number, initiator: User): Promise<Category> {
    await this.authorizationVerifier.verifyAuthorization(initiator, CategoryPermission.Rate, category)

    const existingRatingMark = await this.categoryRatingMarkRepository.findOneByCategoryAndCreator(category, initiator)

    if (existingRatingMark) {
      throw new CategoryRatedAlready(category)
    }

    const ratingMark = new CategoryRatingMark()
    ratingMark.categoryId = category.id
    ratingMark.mark = mark
    ratingMark.creatorId = initiator.id
    ratingMark.createdAt = new Date()

    await this.entityManager.save<CategoryRatingMark>(ratingMark)
    this.eventDispatcher.dispatch(CategoryEvent.Rated, { category, user: initiator })

    return category
  }
}