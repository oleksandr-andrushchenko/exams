import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import Category from '../../entities/category/Category'
import CategoryPermission from '../../enums/category/CategoryPermission'
import CategoryRepository from '../../repositories/category/CategoryRepository'
import EventDispatcher from '../event/EventDispatcher'
import CategoryEvent from '../../enums/category/CategoryEvent'

@Service()
export default class CategoryApproveSwitcher {

  public constructor(
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject() private readonly categoryRepository: CategoryRepository,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
  ) {
  }

  /**
   * @param {Category} category
   * @param {User} initiator
   * @returns {Promise<Question>}
   * @throws {AuthorizationFailedError}
   */
  public async toggleCategoryApprove(category: Category, initiator: User): Promise<Category> {
    await this.authorizationVerifier.verifyAuthorization(initiator, CategoryPermission.Approve)

    await this.categoryRepository.updateOneByEntity(category, {
      ownerId: this.isCategoryApproved(category) ? category.creatorId : undefined,
      updatedAt: new Date(),
    })

    this.eventDispatcher.dispatch(CategoryEvent.ApproveToggled, { category, initiator })

    if (this.isCategoryApproved(category)) {
      this.eventDispatcher.dispatch(CategoryEvent.Approved, { category, initiator })
    }

    return category
  }

  public isCategoryApproved(category: Category): boolean {
    return !category.ownerId
  }
}