import Repository from '../../decorators/Repository'
import Question from '../../entities/question/Question'
import EntityRepository from '../EntityRepository'
import Category from '../../entities/category/Category'

@Repository(Question)
export default class QuestionRepository extends EntityRepository<Question> {

  public async findOneByTitle(title: string): Promise<Question | null> {
    return await this.findOneBy({ title })
  }

  public async countByCategory(category: Category): Promise<number> {
    return await this.countBy({ categoryId: category.id })
  }

  public async findByCategoryWithoutOwner(category: Category): Promise<Question[]> {
    return await this.findBy({ categoryId: category.id, ownerId: { $exists: false } })
  }

  public async countByCategoryWithoutOwner(category: Category): Promise<number> {
    return await this.countBy({ categoryId: category.id, ownerId: { $exists: false } })
  }
}