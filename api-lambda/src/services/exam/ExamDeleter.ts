import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import Exam from '../../entities/exam/Exam'
import User from '../../entities/user/User'
import ExamPermission from '../../enums/exam/ExamPermission'
import QuestionDeleter from '../question/QuestionDeleter'
import Question from '../../entities/question/Question'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import ExamQuestionListProvider from '../question/ExamQuestionListProvider'
import EventDispatcher from '../event/EventDispatcher'
import ExamEvent from '../../enums/exam/ExamEvent'

@Service()
export default class ExamDeleter {
  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject() private readonly examQuestionListProvider: ExamQuestionListProvider,
    @Inject() private readonly questionDeleter: QuestionDeleter,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier
  ) {}

  /**
   * @param {Exam} exam
   * @param {User} initiator
   * @returns {Promise<Exam>}
   * @throws {ExamNotFoundError}
   * @throws {AuthorizationFailedError}
   */
  public async deleteExam(exam: Exam, initiator: User): Promise<Exam> {
    await this.authorizationVerifier.verifyAuthorization(initiator, ExamPermission.Delete, exam)

    const questions = (await this.examQuestionListProvider.getExamQuestions(exam)) as Question[]

    for (const question of questions) {
      await this.questionDeleter.deleteQuestion(question, initiator)
    }

    exam.deletedAt = new Date()

    await this.entityManager.save<Exam>(exam)
    await this.eventDispatcher.dispatch(ExamEvent.Deleted, { exam })

    return exam
  }
}
