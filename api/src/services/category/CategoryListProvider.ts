import { Inject, Service } from 'typedi'
import Category from '../../entities/category/Category'
import CategoryRepository from '../../repositories/category/CategoryRepository'
import ValidatorInterface from '../validator/ValidatorInterface'
import Cursor from '../../models/Cursor'
import GetCategories from '../../schema/category/GetCategories'
import PaginatedCategories from '../../schema/category/PaginatedCategories'
import User from '../../entities/user/User'
import IdNormalizer from '../normalizers/IdNormalizer'

@Service()
export default class CategoryListProvider {

  public constructor(
    @Inject() private readonly categoryRepository: CategoryRepository,
    @Inject('validator') private readonly validator: ValidatorInterface,
    @Inject() private readonly idNormalizer: IdNormalizer,
  ) {
  }

  /**
   * @param {GetCategories} getCategories
   * @param {boolean} meta
   * @param {User} initiator
   * @returns {Promise<Category[] | PaginatedCategories>}
   * @throws {ValidatorError}
   */
  public async getCategories(
    getCategories: GetCategories,
    meta: boolean = false,
    initiator?: User,
  ): Promise<Category[] | PaginatedCategories> {
    await this.validator.validate(getCategories)

    const cursor = new Cursor<Category>(getCategories, this.categoryRepository)
    const where: Partial<Record<keyof Category, any>> = {}

    if ('subscription' in getCategories) {
      where['subscription'] = { $exists: getCategories.subscription === 'yes' }
    }

    if ('approved' in getCategories) {
      where.ownerId = { $exists: getCategories.approved !== 'yes' }
    }

    if ('search' in getCategories) {
      where.name = { $regex: getCategories.search, $options: 'i' }
    }

    if ('creator' in getCategories && initiator) {
      if (getCategories.creator === 'i') {
        where.creatorId = initiator.id
      } else {
        where.creatorId = { $ne: initiator.id }
      }
    }

    return await cursor.getPaginated({ where, meta })
  }

  public async getCategoriesByIds(categoryIds: string[]): Promise<Category[]> {
    const ids = categoryIds.map(categoryId => this.idNormalizer.normalizeId(categoryId))

    return await this.categoryRepository.findByIds(ids)
  }
}