import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import Question from '../../entities/question/Question'
import CategoryProvider from '../category/CategoryProvider'
import QuestionPermission from '../../enums/question/QuestionPermission'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import QuestionRepository from '../../repositories/question/QuestionRepository'
import CategoryRepository from '../../repositories/category/CategoryRepository'
import EventDispatcher from '../event/EventDispatcher'
import QuestionEvent from '../../enums/question/QuestionEvent'

@Service()
export default class QuestionDeleter {

  public constructor(
    @Inject() private readonly categoryProvider: CategoryProvider,
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject() private readonly questionRepository: QuestionRepository,
    @Inject() private readonly categoryRepository: CategoryRepository,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
  ) {
  }

  /**
   * @param {Question} question
   * @param {User} initiator
   * @returns {Promise<Question>}
   * @throws {QuestionNotFoundError}
   * @throws {AuthorizationFailedError}
   */
  public async deleteQuestion(question: Question, initiator: User): Promise<Question> {
    await this.authorizationVerifier.verifyAuthorization(initiator, QuestionPermission.Delete, question)

    const category = await this.categoryProvider.getCategory(question.categoryId.toString())

    await this.questionRepository.updateOneByEntity(question, { deletedAt: new Date() })

    const newQuestionCount = Math.max(0, await this.questionRepository.countByCategory(category) - 1)
    await this.categoryRepository.updateOneByEntity(category, {
      questionCount: newQuestionCount === 0 ? undefined : newQuestionCount,
      updatedAt: new Date(),
    })

    this.eventDispatcher.dispatch(QuestionEvent.Deleted, { question })

    return question
  }
}