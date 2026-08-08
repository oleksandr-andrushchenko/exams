import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import ValidatorInterface from '../validator/ValidatorInterface'
import ExamSessionRepository from '../../repositories/ExamSessionRepository'
import ExamSession from '../../entities/examSession/ExamSession'
import ExamSessionNotFoundError from '../../errors/examSession/ExamSessionNotFoundError'
import { ObjectId } from 'bson'
import ExamSessionPermission from '../../enums/examSession/ExamSessionPermission'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'

@Service()
export default class ExamSessionProvider {
  public constructor(
    @Inject() private readonly examSessionRepository: ExamSessionRepository,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @Inject('validator') private readonly validator: ValidatorInterface
  ) {}

  /**
   * @param {ObjectId | string} id
   * @param {User} initiator
   * @returns {Promise<ExamSession>}
   * @throws {ExamSessionNotFoundError}
   * @throws {AuthorizationFailedError}
   */
  public async getExamSession(id: ObjectId | string, initiator: User): Promise<ExamSession> {
    if (typeof id === 'string') {
      this.validator.validateId(id)
      id = new ObjectId(id)
    }

    const examSession = await this.examSessionRepository.findOneById(id)

    if (!examSession) {
      throw new ExamSessionNotFoundError(id)
    }

    await this.authorizationVerifier.verifyAuthorization(initiator, ExamSessionPermission.Get, examSession)

    if ('correctAnswerCount' in examSession && !examSession.completedAt) {
      delete examSession.correctAnswerCount
    }

    return examSession
  }
}
