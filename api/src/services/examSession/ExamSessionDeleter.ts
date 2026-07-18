import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import User from '../../entities/user/User'
import ExamSession from '../../entities/examSession/ExamSession'
import ExamSessionPermission from '../../enums/examSession/ExamSessionPermission'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import EventDispatcher from '../event/EventDispatcher'
import ExamSessionEvent from '../../enums/examSession/ExamSessionEvent'

@Service()
export default class ExamSessionDeleter {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
  ) {
  }

  /**
   * @param {ExamSession} examSession
   * @param {User} initiator
   * @returns {Promise<ExamSession>}
   * @throws {ExamSessionNotFoundError}
   * @throws {AuthorizationFailedError}
   */
  public async deleteExamSession(examSession: ExamSession, initiator: User): Promise<ExamSession> {
    await this.authorizationVerifier.verifyAuthorization(initiator, ExamSessionPermission.Delete, examSession)

    examSession.deletedAt = new Date()

    await this.entityManager.save<ExamSession>(examSession)
    await this.eventDispatcher.dispatch(ExamSessionEvent.Deleted, { examSession, user: initiator })

    return examSession
  }
}