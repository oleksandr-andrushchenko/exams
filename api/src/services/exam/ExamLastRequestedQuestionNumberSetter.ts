import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import User from '../../entities/user/User'
import Exam from '../../entities/exam/Exam'
import ExamQuestionNumberNotFoundError from '../../errors/exam/ExamQuestionNumberNotFoundError'
import ExamPermission from '../../enums/exam/ExamPermission'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'

@Service()
export default class ExamLastRequestedQuestionNumberSetter {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
  ) {
  }

  /**
   * @param {Exam} exam
   * @param {number} questionNumber
   * @param {User} initiator
   * @returns {Promise<Exam>}
   * @throws {AuthorizationFailedError}
   * @throws {ExamQuestionNumberNotFoundError}
   */
  public async setExamLastRequestedQuestionNumber(exam: Exam, questionNumber: number, initiator: User): Promise<Exam> {
    await this.authorizationVerifier.verifyAuthorization(initiator, ExamPermission.GetQuestion, exam)

    const questions = exam.questions

    if (typeof questions[questionNumber] === 'undefined') {
      throw new ExamQuestionNumberNotFoundError(questionNumber)
    }

    if (exam.ownerId.toString() !== initiator.id.toString()) {
      return exam
    }

    exam.questionNumber = questionNumber
    exam.updatedAt = new Date()

    await this.entityManager.save<Exam>(exam)

    return exam
  }
}