import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import User from '../../entities/user/User'
import ValidatorInterface from '../validator/ValidatorInterface'
import ExamProvider from '../exam/ExamProvider'
import CreateExamSession from '../../schema/examSession/CreateExamSession'
import ExamSession from '../../entities/examSession/ExamSession'
import Question from '../../entities/question/Question'
import ExamSessionPermission from '../../enums/examSession/ExamSessionPermission'
import ExamSessionQuestion from '../../entities/examSession/ExamSessionQuestion'
import ExamSessionVerifier from './ExamSessionVerifier'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import ExamVerifier from '../exam/ExamVerifier'
import QuestionRepository from '../../repositories/question/QuestionRepository'
import EventDispatcher from '../event/EventDispatcher'
import ExamSessionEvent from '../../enums/examSession/ExamSessionEvent'

@Service()
export default class ExamSessionCreator {
  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly examProvider: ExamProvider,
    @Inject() private readonly examSessionVerifier: ExamSessionVerifier,
    @Inject() private readonly examVerifier: ExamVerifier,
    @Inject() private readonly questionRepository: QuestionRepository,
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @Inject('validator') private readonly validator: ValidatorInterface
  ) {}

  /**
   * @param {CreateExamSession} createExamSession
   * @param {User} initiator
   * @returns {Promise<ExamSession>}
   * @throws {AuthorizationFailedError}
   * @throws {ExamNotFoundError}
   * @throws {ExamSessionTakenError}
   * @throws {ExamNotApprovedError}
   * @throws {ExamWithoutApprovedQuestionsError}
   */
  public async createExamSession(createExamSession: CreateExamSession, initiator: User): Promise<ExamSession> {
    await this.authorizationVerifier.verifyAuthorization(initiator, ExamSessionPermission.Create)

    await this.validator.validate(createExamSession)
    const exam = await this.examProvider.getExam(createExamSession.examId)

    this.examVerifier.verifyExamApproved(exam)
    this.examVerifier.verifyExamHasApprovedQuestions(exam)

    await this.examSessionVerifier.verifyExamSessionNotTaken(exam, initiator)

    const questions = (await this.questionRepository.findByExamWithoutOwner(exam)).map(
      (question: Question): ExamSessionQuestion => {
        const examSessionQuestion = new ExamSessionQuestion()
        examSessionQuestion.questionId = question.id

        return examSessionQuestion
      }
    )

    const examSession = new ExamSession()
    examSession.examId = exam.id
    examSession.questions = questions
    examSession.creatorId = initiator.id
    examSession.ownerId = initiator.id
    examSession.createdAt = new Date()

    await this.entityManager.save<ExamSession>(examSession)
    await this.eventDispatcher.dispatch(ExamSessionEvent.Created, { examSession, user: initiator })

    return examSession
  }
}
