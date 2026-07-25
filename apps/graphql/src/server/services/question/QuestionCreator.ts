import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import User from '../../entities/user/User'
import ValidatorInterface from '../validator/ValidatorInterface'
import Question from '../../entities/question/Question'
import CreateQuestion from '../../schema/question/CreateQuestion'
import ExamProvider from '../exam/ExamProvider'
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
    @Inject() private readonly examProvider: ExamProvider,
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
   * @throws {ExamNotFoundError}
   * @throws {AuthorizationFailedError}
   * @throws {QuestionTitleTakenError}
   */
  public async createQuestion(createQuestion: CreateQuestion, initiator: User): Promise<Question> {
    await this.validator.validate(createQuestion)
    await this.authorizationVerifier.verifyAuthorization(initiator, QuestionPermission.Create)

    const exam = await this.examProvider.getExam(createQuestion.examId)
    // await this.authorizationVerifier.verifyAuthorization(initiator, ExamPermission.AddQuestion, exam)

    const title = createQuestion.title
    await this.questionVerifier.verifyQuestionTitleNotExists(title)

    const question: Question = new Question()
    question.examId = exam.id
    question.type = createQuestion.type
    question.difficulty = createQuestion.difficulty
    question.title = title
    question.creatorId = initiator.id
    question.ownerId = initiator.id

    if (question.type === QuestionType.CHOICE) {
      question.choices = createQuestion.choices
    }

    question.createdAt = new Date()
    exam.questionCount = await this.questionRepository.countByExam(exam) + 1

    await this.entityManager.save([ question, exam ])
    await this.eventDispatcher.dispatch(QuestionEvent.Created, { question })

    return question
  }
}