import { Inject, Service } from 'typedi'
import Category from '../../entities/category/Category'
import CategoryRepository from '../../repositories/category/CategoryRepository'
import CategoryNotFoundError from '../../errors/category/CategoryNotFoundError'
import { ObjectId } from 'mongodb'
import ValidatorInterface from '../validator/ValidatorInterface'

@Service()
export default class CategoryProvider {

  public constructor(
    @Inject() private readonly categoryRepository: CategoryRepository,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {ObjectId | string} id
   * @returns {Promise<Category>}
   * @throws {CategoryNotFoundError}
   */
  public async getCategory(id: ObjectId | string): Promise<Category> {
    if (typeof id === 'string') {
      this.validator.validateId(id)
      id = new ObjectId(id)
    }

    const category = await this.categoryRepository.findOneById(id)

    if (!category) {
      throw new CategoryNotFoundError(id)
    }

    return category
  }
}