import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import User from '../../entities/user/User'
import Exam from '../../entities/exam/Exam'
import ExamPermission from '../../enums/exam/ExamPermission'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import EventDispatcher from '../event/EventDispatcher'
import ExamEvent from '../../enums/exam/ExamEvent'

@Service()
export default class ExamDeleter {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
  ) {
  }

  /**
   * @param {Exam} exam
   * @param {User} initiator
   * @returns {Promise<Exam>}
   * @throws {ExamNotFoundError}
   * @throws {AuthorizationFailedError}
   */
  public async deleteExam(exam: Exam, initiator: User): Promise<Exam> {
    await this.authorizationVerifier.verifyAuthorization(initiator, ExamPermission.Delete, exam)

    exam.deletedAt = new Date()

    await this.entityManager.save<Exam>(exam)
    this.eventDispatcher.dispatch(ExamEvent.Deleted, { exam, user: initiator })

    return exam
  }
}