import CategoryRatingMark from '../../entities/category/CategoryRatingMark'
import EntityRepository from '../EntityRepository'
import Repository from '../../decorators/Repository'
import Category from '../../entities/category/Category'
import User from '../../entities/user/User'

@Repository(CategoryRatingMark)
export default class CategoryRatingMarkRepository extends EntityRepository<CategoryRatingMark> {

  public async countByCategory(category: Category): Promise<number> {
    return await this.countBy({ categoryId: category.id })
  }

  public async sumByCategory(category: Category): Promise<number> {
    return await this.sumBy('mark', { categoryId: category.id })
  }

  public async findByCreator(creator: User): Promise<CategoryRatingMark[]> {
    return await this.findBy({ creatorId: creator.id })
  }

  public async findByCategoriesAndCreator(categories: Category[], creator: User): Promise<CategoryRatingMark[]> {
    return await this.findBy({
      categoryId: { $in: categories.map(category => category.id) },
      creatorId: creator.id,
    })
  }

  public async findOneByCategoryAndCreator(category: Category, creator: User): Promise<CategoryRatingMark | null> {
    return await this.findOneBy({
      categoryId: category.id,
      creatorId: creator.id,
    })
  }
}