import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import ValidatorInterface from '../validator/ValidatorInterface'
import Cursor from '../../models/Cursor'
import ExamSessionRepository from '../../repositories/ExamSessionRepository'
import ExamSession from '../../entities/examSession/ExamSession'
import { ObjectId } from 'bson'
import AuthorizationFailedError from '../../errors/auth/AuthorizationFailedError'
import GetExamSessions from '../../schema/examSession/GetExamSessions'
import ExamSessionPermission from '../../enums/examSession/ExamSessionPermission'
import PaginatedExamSessions from '../../schema/examSession/PaginatedExamSessions'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'

@Service()
export default class ExamSessionListProvider {

  public constructor(
    @Inject() private readonly examSessionRepository: ExamSessionRepository,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {GetExamSessions} getExamSessions
   * @param {User} initiator
   * @param {boolean} meta
   * @returns {Promise<ExamSession[] | PaginatedExamSessions>}
   * @throws {ValidatorError}
   */
  public async getExamSessions(
    getExamSessions: GetExamSessions,
    initiator: User,
    meta: boolean = false,
  ): Promise<ExamSession[] | PaginatedExamSessions> {
    await this.validator.validate(getExamSessions)

    const cursor = new Cursor<ExamSession>(getExamSessions, this.examSessionRepository)
    const where = {}

    try {
      await this.authorizationVerifier.verifyAuthorization(initiator, ExamSessionPermission.Get)
    } catch (error) {
      if (error instanceof AuthorizationFailedError) {
        where['ownerId'] = initiator.id
      } else {
        throw error
      }
    }

    // where['ownerId'] = initiator.id

    if ('examId' in getExamSessions) {
      where['examId'] = new ObjectId(getExamSessions.examId)
    }

    if ('completion' in getExamSessions) {
      where['completedAt'] = { $exists: getExamSessions.completion }
    }

    return await cursor.getPaginated({ where, meta })
  }
}