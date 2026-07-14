import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import Question from '../../entities/question/Question'
import QuestionPermission from '../../enums/question/QuestionPermission'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import QuestionRepository from '../../repositories/question/QuestionRepository'
import CategoryProvider from '../category/CategoryProvider'
import CategoryRepository from '../../repositories/category/CategoryRepository'
import EventDispatcher from '../event/EventDispatcher'
import QuestionEvent from '../../enums/question/QuestionEvent'

@Service()
export default class QuestionApproveSwitcher {

  public constructor(
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject() private readonly categoryProvider: CategoryProvider,
    @Inject() private readonly questionRepository: QuestionRepository,
    @Inject() private readonly categoryRepository: CategoryRepository,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
  ) {
  }

  /**
   * @param {Question} question
   * @param {User} initiator
   * @returns {Promise<Question>}
   * @throws {AuthorizationFailedError}
   */
  public async toggleQuestionApprove(question: Question, initiator: User): Promise<Question> {
    await this.authorizationVerifier.verifyAuthorization(initiator, QuestionPermission.Approve)

    const category = await this.categoryProvider.getCategory(question.categoryId)
    const approvedQuestionCount = await this.questionRepository.countByCategoryWithoutOwner(category)

    if (this.isQuestionApproved(question)) {
      await this.questionRepository.updateOneByEntity(question, { ownerId: question.creatorId, updatedAt: new Date() })

      const newApprovedQuestionCount = Math.max(0, approvedQuestionCount - 1)
      await this.categoryRepository.updateOneByEntity(category, {
        approvedQuestionCount: newApprovedQuestionCount === 0 ? undefined : newApprovedQuestionCount,
        updatedAt: new Date(),
      })
    } else {
      await this.questionRepository.updateOneByEntity(question, { ownerId: undefined, updatedAt: new Date() })

      await this.categoryRepository.updateOneByEntity(category, {
        approvedQuestionCount: approvedQuestionCount + 1,
        updatedAt: new Date(),
      })
    }

    this.eventDispatcher.dispatch(QuestionEvent.ApproveToggled, { question, initiator })

    return question
  }

  public isQuestionApproved(question: Question): boolean {
    return !question.ownerId
  }
}