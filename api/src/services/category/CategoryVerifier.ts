import { Inject, Service } from 'typedi'
import CategoryRepository from '../../repositories/category/CategoryRepository'
import CategoryNameTakenError from '../../errors/category/CategoryNameTakenError'
import { ObjectId } from 'mongodb'
import Category from '../../entities/category/Category'
import CategoryWithoutApprovedQuestionsError from '../../errors/category/CategoryWithoutApprovedQuestionsError'
import CategoryApproveSwitcher from './CategoryApproveSwitcher'
import CategoryNotApprovedError from '../../errors/category/CategoryNotApprovedError'

@Service()
export default class CategoryVerifier {

  public constructor(
    @Inject() private readonly categoryRepository: CategoryRepository,
    @Inject() private readonly categoryApproveSwitcher: CategoryApproveSwitcher,
  ) {
  }

  /**
   * @param {string} name
   * @param {ObjectId} ignoreId
   * @returns {Promise<void>}
   * @throws {CategoryNameTakenError}
   */
  public async verifyCategoryNameNotExists(name: string, ignoreId: ObjectId = undefined): Promise<void> {
    const category = await this.categoryRepository.findOneByName(name)

    if (!category) {
      return
    }

    if (ignoreId && category.id.toString() === ignoreId.toString()) {
      return
    }

    throw new CategoryNameTakenError(name)
  }

  /**
   * @param {Category} category
   * @returns {void}
   * @throws {CategoryNotApprovedError}
   */
  public verifyCategoryApproved(category: Category): void {
    if (!this.categoryApproveSwitcher.isCategoryApproved(category)) {
      throw new CategoryNotApprovedError(category)
    }
  }

  /**
   * @param {Category} category
   * @returns {void}
   * @throws {CategoryWithoutApprovedQuestionsError}
   */
  public verifyCategoryHasApprovedQuestions(category: Category): void {
    if (!category.approvedQuestionCount) {
      throw new CategoryWithoutApprovedQuestionsError(category)
    }
  }
}