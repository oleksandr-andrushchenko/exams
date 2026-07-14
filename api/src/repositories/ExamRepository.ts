import Repository from '../decorators/Repository'
import Exam from '../entities/exam/Exam'
import EntityRepository from './EntityRepository'
import User from '../entities/user/User'
import Category from '../entities/category/Category'

@Repository(Exam)
export default class ExamRepository extends EntityRepository<Exam> {

  public async findOneByCategoryAndOwnerWithoutCompleted(category: Category, owner: User): Promise<Exam | null> {
    return await this.findOneBy({
      categoryId: category.id,
      ownerId: owner.id,
      completedAt: { $exists: false },
    })
  }

  public async findByCategoriesAndOwnerWithoutCompleted(categories: Category[], owner: User): Promise<Exam[]> {
    return await this.findBy({
      categoryId: { $in: categories.map(category => category.id) },
      ownerId: owner.id,
      completedAt: { $exists: false },
    })
  }

  public async findByCreatorWithoutCompleted(creator: User): Promise<Exam[]> {
    return await this.findBy({
      creatorId: creator.id,
      completedAt: { $exists: false },
    })
  }
}