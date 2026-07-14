import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import User from '../../entities/user/User'
import ValidatorInterface from '../validator/ValidatorInterface'
import Question from '../../entities/question/Question'
import CategoryProvider from '../category/CategoryProvider'
import UpdateQuestion from '../../schema/question/UpdateQuestion'
import QuestionPermission from '../../enums/question/QuestionPermission'
import QuestionType from '../../entities/question/QuestionType'
import QuestionVerifier from './QuestionVerifier'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import EventDispatcher from '../event/EventDispatcher'
import QuestionEvent from '../../enums/question/QuestionEvent'

@Service()
export default class QuestionUpdater {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly categoryProvider: CategoryProvider,
    @Inject() private readonly questionVerifier: QuestionVerifier,
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {Question} question
   * @param {UpdateQuestion} updateQuestion
   * @param {User} initiator
   * @returns {Promise<Question>}
   * @throws {QuestionNotFoundError}
   * @throws {CategoryNotFoundError}
   * @throws {AuthorizationFailedError}
   * @throws {QuestionTitleTakenError}
   */
  public async updateQuestion(question: Question, updateQuestion: UpdateQuestion, initiator: User): Promise<Question> {
    await this.validator.validate(updateQuestion)
    await this.authorizationVerifier.verifyAuthorization(initiator, QuestionPermission.Update, question)

    if ('categoryId' in updateQuestion) {
      const category = await this.categoryProvider.getCategory(updateQuestion.categoryId)
      // await this.authorizationVerifier.verifyAuthorization(initiator, CategoryPermission.AddQuestion, category)
      question.categoryId = category.id
    }

    if ('title' in updateQuestion) {
      const title = updateQuestion.title
      await this.questionVerifier.verifyQuestionTitleNotExists(title, question.id)
      question.title = title
    }

    if ('type' in updateQuestion) {
      question.type = updateQuestion.type
    }

    if ('difficulty' in updateQuestion) {
      question.difficulty = updateQuestion.difficulty
    }

    if (question.type === QuestionType.CHOICE) {
      if ('choices' in updateQuestion) {
        question.choices = updateQuestion.choices
      }
    }

    question.updatedAt = new Date()

    await this.entityManager.save<Question>(question)
    this.eventDispatcher.dispatch(QuestionEvent.Updated, { question })

    return question
  }
}