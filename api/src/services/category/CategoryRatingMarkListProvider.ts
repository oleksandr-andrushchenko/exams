import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import Category from '../../entities/category/Category'
import CategoryRatingMarkRepository from '../../repositories/category/CategoryRatingMarkRepository'
import CategoryRatingMark from '../../entities/category/CategoryRatingMark'

@Service()
export default class CategoryRatingMarkListProvider {

  public constructor(
    @Inject() private readonly categoryRatingMarkRepository: CategoryRatingMarkRepository,
  ) {
  }

  /**
   * @param {Category[]} categories
   * @param {User} initiator
   * @returns {Promise<Exam[]>}
   */
  public async getCategoryRatingMarks(categories: Category[], initiator: User): Promise<CategoryRatingMark[]> {
    return await this.categoryRatingMarkRepository.findByCategoriesAndCreator(categories, initiator)
  }
}