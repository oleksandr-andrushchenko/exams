import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import ValidatorInterface from '../validator/ValidatorInterface'
import Cursor from '../../models/Cursor'
import ExamRepository from '../../repositories/ExamRepository'
import Exam from '../../entities/exam/Exam'
import { ObjectId } from 'mongodb'
import AuthorizationFailedError from '../../errors/auth/AuthorizationFailedError'
import GetExams from '../../schema/exam/GetExams'
import ExamPermission from '../../enums/exam/ExamPermission'
import PaginatedExams from '../../schema/exam/PaginatedExams'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'

@Service()
export default class ExamListProvider {

  public constructor(
    @Inject() private readonly examRepository: ExamRepository,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {GetExams} getExams
   * @param {User} initiator
   * @param {boolean} meta
   * @returns {Promise<Exam[] | PaginatedExams>}
   * @throws {ValidatorError}
   */
  public async getExams(
    getExams: GetExams,
    initiator: User,
    meta: boolean = false,
  ): Promise<Exam[] | PaginatedExams> {
    await this.validator.validate(getExams)

    const cursor = new Cursor<Exam>(getExams, this.examRepository)
    const where = {}

    try {
      await this.authorizationVerifier.verifyAuthorization(initiator, ExamPermission.Get)
    } catch (error) {
      if (error instanceof AuthorizationFailedError) {
        where['ownerId'] = initiator.id
      } else {
        throw error
      }
    }

    // where['ownerId'] = initiator.id

    if ('categoryId' in getExams) {
      where['categoryId'] = new ObjectId(getExams.categoryId)
    }

    if ('completion' in getExams) {
      where['completedAt'] = { $exists: getExams.completion }
    }

    return await cursor.getPaginated({ where, meta })
  }
}