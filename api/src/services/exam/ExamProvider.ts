import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import ValidatorInterface from '../validator/ValidatorInterface'
import ExamRepository from '../../repositories/ExamRepository'
import Exam from '../../entities/exam/Exam'
import ExamNotFoundError from '../../errors/exam/ExamNotFoundError'
import { ObjectId } from 'mongodb'
import ExamPermission from '../../enums/exam/ExamPermission'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'

@Service()
export default class ExamProvider {

  public constructor(
    @Inject() private readonly examRepository: ExamRepository,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {ObjectId | string} id
   * @param {User} initiator
   * @returns {Promise<Exam>}
   * @throws {ExamNotFoundError}
   * @throws {AuthorizationFailedError}
   */
  public async getExam(id: ObjectId | string, initiator: User): Promise<Exam> {
    if (typeof id === 'string') {
      this.validator.validateId(id)
      id = new ObjectId(id)
    }

    const exam = await this.examRepository.findOneById(id)

    if (!exam) {
      throw new ExamNotFoundError(id)
    }

    await this.authorizationVerifier.verifyAuthorization(initiator, ExamPermission.Get, exam)

    if ('correctAnswerCount' in exam && !exam.completedAt) {
      delete exam.correctAnswerCount
    }

    return exam
  }
}