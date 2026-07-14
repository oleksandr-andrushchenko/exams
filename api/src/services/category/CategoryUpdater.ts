import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import Category from '../../entities/category/Category'
import User from '../../entities/user/User'
import UpdateCategory from '../../schema/category/UpdateCategory'
import ValidatorInterface from '../validator/ValidatorInterface'
import CategoryPermission from '../../enums/category/CategoryPermission'
import CategoryVerifier from './CategoryVerifier'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import EventDispatcher from '../event/EventDispatcher'
import CategoryEvent from '../../enums/category/CategoryEvent'

@Service()
export default class CategoryUpdater {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly categoryVerifier: CategoryVerifier,
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {Category} category
   * @param {UpdateCategory} updateCategory
   * @param {User} initiator
   * @returns {Promise<Category>}
   * @throws {CategoryNotFoundError}
   * @throws {AuthorizationFailedError}
   * @throws {CategoryNameTakenError}
   */
  public async updateCategory(category: Category, updateCategory: UpdateCategory, initiator: User): Promise<Category> {
    await this.validator.validate(updateCategory)

    await this.authorizationVerifier.verifyAuthorization(initiator, CategoryPermission.Update, category)

    if ('name' in updateCategory) {
      const name = updateCategory.name
      await this.categoryVerifier.verifyCategoryNameNotExists(name, category.id)

      category.name = name
    }

    if ('requiredScore' in updateCategory) {
      category.requiredScore = updateCategory.requiredScore
    }

    category.updatedAt = new Date()

    await this.entityManager.save<Category>(category)
    this.eventDispatcher.dispatch(CategoryEvent.Updated, { category })

    return category
  }
}