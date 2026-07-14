import Category from '../../entities/category/Category'
import Repository from '../../decorators/Repository'
import EntityRepository from '../EntityRepository'
import User from '../../entities/user/User'

@Repository(Category)
export default class CategoryRepository extends EntityRepository<Category> {

  public async findOneByName(name: string): Promise<Category | null> {
    return await this.findOneBy({ name })
  }

  public async findByOwner(owner: User): Promise<Category[]> {
    return await this.findBy({
      ownerId: owner.id,
    })
  }
}