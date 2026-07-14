import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import Category from '../../entities/category/Category'
import User from '../../entities/user/User'
import CreateCategory from '../../schema/category/CreateCategory'
import ValidatorInterface from '../validator/ValidatorInterface'
import CategoryPermission from '../../enums/category/CategoryPermission'
import CategoryVerifier from './CategoryVerifier'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import EventDispatcher from '../event/EventDispatcher'
import CategoryEvent from '../../enums/category/CategoryEvent'

@Service()
export default class CategoryCreator {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly categoryVerifier: CategoryVerifier,
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {CreateCategory} createCategory
   * @param {User} initiator
   * @returns {Promise<Category>}
   * @throws {AuthorizationFailedError}
   * @throws {CategoryNameTakenError}
   */
  public async createCategory(createCategory: CreateCategory, initiator: User): Promise<Category> {
    await this.validator.validate(createCategory)

    await this.authorizationVerifier.verifyAuthorization(initiator, CategoryPermission.Create)

    const name = createCategory.name
    await this.categoryVerifier.verifyCategoryNameNotExists(name)

    const category: Category = new Category()
    category.name = name
    category.requiredScore = createCategory.requiredScore
    category.creatorId = initiator.id
    category.ownerId = initiator.id
    category.createdAt = new Date()

    await this.entityManager.save<Category>(category)
    this.eventDispatcher.dispatch(CategoryEvent.Created, { category })

    return category
  }
}