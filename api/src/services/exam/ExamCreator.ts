import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import User from '../../entities/user/User'
import ValidatorInterface from '../validator/ValidatorInterface'
import CategoryProvider from '../category/CategoryProvider'
import CreateExam from '../../schema/exam/CreateExam'
import Exam from '../../entities/exam/Exam'
import Question from '../../entities/question/Question'
import ExamPermission from '../../enums/exam/ExamPermission'
import ExamQuestion from '../../entities/exam/ExamQuestion'
import ExamVerifier from './ExamVerifier'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import CategoryVerifier from '../category/CategoryVerifier'
import QuestionRepository from '../../repositories/question/QuestionRepository'
import EventDispatcher from '../event/EventDispatcher'
import ExamEvent from '../../enums/exam/ExamEvent'

@Service()
export default class ExamCreator {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly categoryProvider: CategoryProvider,
    @Inject() private readonly examVerifier: ExamVerifier,
    @Inject() private readonly categoryVerifier: CategoryVerifier,
    @Inject() private readonly questionRepository: QuestionRepository,
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {CreateExam} createExam
   * @param {User} initiator
   * @returns {Promise<Exam>}
   * @throws {AuthorizationFailedError}
   * @throws {CategoryNotFoundError}
   * @throws {ExamTakenError}
   * @throws {CategoryNotApprovedError}
   * @throws {CategoryWithoutApprovedQuestionsError}
   */
  public async createExam(createExam: CreateExam, initiator: User): Promise<Exam> {
    await this.authorizationVerifier.verifyAuthorization(initiator, ExamPermission.Create)

    await this.validator.validate(createExam)
    const category = await this.categoryProvider.getCategory(createExam.categoryId)

    this.categoryVerifier.verifyCategoryApproved(category)
    this.categoryVerifier.verifyCategoryHasApprovedQuestions(category)

    await this.examVerifier.verifyExamNotTaken(category, initiator)

    const questions = (await this.questionRepository.findByCategoryWithoutOwner(category))
      .map((question: Question): ExamQuestion => {
        const examQuestion = new ExamQuestion()
        examQuestion.questionId = question.id

        return examQuestion
      })

    const exam = new Exam()
    exam.categoryId = category.id
    exam.questions = questions
    exam.creatorId = initiator.id
    exam.ownerId = initiator.id
    exam.createdAt = new Date()

    await this.entityManager.save<Exam>(exam)
    this.eventDispatcher.dispatch(ExamEvent.Created, { exam, user: initiator })

    return exam
  }
}