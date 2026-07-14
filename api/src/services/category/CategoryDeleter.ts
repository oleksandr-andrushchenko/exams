import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import Category from '../../entities/category/Category'
import User from '../../entities/user/User'
import CategoryPermission from '../../enums/category/CategoryPermission'
import QuestionDeleter from '../question/QuestionDeleter'
import Question from '../../entities/question/Question'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import CategoryQuestionListProvider from '../question/CategoryQuestionListProvider'
import EventDispatcher from '../event/EventDispatcher'
import CategoryEvent from '../../enums/category/CategoryEvent'

@Service()
export default class CategoryDeleter {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject() private readonly categoryQuestionListProvider: CategoryQuestionListProvider,
    @Inject() private readonly questionDeleter: QuestionDeleter,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
  ) {
  }

  /**
   * @param {Category} category
   * @param {User} initiator
   * @returns {Promise<Category>}
   * @throws {CategoryNotFoundError}
   * @throws {AuthorizationFailedError}
   */
  public async deleteCategory(category: Category, initiator: User): Promise<Category> {
    await this.authorizationVerifier.verifyAuthorization(initiator, CategoryPermission.Delete, category)

    const questions = await this.categoryQuestionListProvider.getCategoryQuestions(category) as Question[]

    for (const question of questions) {
      await this.questionDeleter.deleteQuestion(question, initiator)
    }

    category.deletedAt = new Date()

    await this.entityManager.save<Category>(category)
    this.eventDispatcher.dispatch(CategoryEvent.Deleted, { category })

    return category
  }
}