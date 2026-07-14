import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import User from '../../entities/user/User'
import ValidatorInterface from '../validator/ValidatorInterface'
import Question from '../../entities/question/Question'
import CreateQuestion from '../../schema/question/CreateQuestion'
import CategoryProvider from '../category/CategoryProvider'
import QuestionPermission from '../../enums/question/QuestionPermission'
import QuestionType from '../../entities/question/QuestionType'
import QuestionVerifier from './QuestionVerifier'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import QuestionRepository from '../../repositories/question/QuestionRepository'
import EventDispatcher from '../event/EventDispatcher'
import QuestionEvent from '../../enums/question/QuestionEvent'

@Service()
export default class QuestionCreator {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly categoryProvider: CategoryProvider,
    @Inject() private readonly questionVerifier: QuestionVerifier,
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @Inject() private readonly questionRepository: QuestionRepository,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {CreateQuestion} createQuestion
   * @param {User} initiator
   * @returns {Promise<Question>}
   * @throws {CategoryNotFoundError}
   * @throws {AuthorizationFailedError}
   * @throws {QuestionTitleTakenError}
   */
  public async createQuestion(createQuestion: CreateQuestion, initiator: User): Promise<Question> {
    await this.validator.validate(createQuestion)
    await this.authorizationVerifier.verifyAuthorization(initiator, QuestionPermission.Create)

    const category = await this.categoryProvider.getCategory(createQuestion.categoryId)
    // await this.authorizationVerifier.verifyAuthorization(initiator, CategoryPermission.AddQuestion, category)

    const title = createQuestion.title
    await this.questionVerifier.verifyQuestionTitleNotExists(title)

    const question: Question = new Question()
    question.categoryId = category.id
    question.type = createQuestion.type
    question.difficulty = createQuestion.difficulty
    question.title = title
    question.creatorId = initiator.id
    question.ownerId = initiator.id

    if (question.type === QuestionType.CHOICE) {
      question.choices = createQuestion.choices
    }

    question.createdAt = new Date()
    category.questionCount = await this.questionRepository.countByCategory(category) + 1

    await this.entityManager.save([ question, category ])
    this.eventDispatcher.dispatch(QuestionEvent.Created, { question })

    return question
  }
}