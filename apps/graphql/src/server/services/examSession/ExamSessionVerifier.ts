import { Inject, Service } from 'typedi'
import Exam from '../../entities/exam/Exam'
import User from '../../entities/user/User'
import ExamSessionRepository from '../../repositories/ExamSessionRepository'
import ExamSessionTakenError from '../../errors/examSession/ExamSessionTakenError'

@Service()
export default class ExamSessionVerifier {
  public constructor(@Inject() private readonly examSessionRepository: ExamSessionRepository) {}

  /**
   * @param {Exam} exam
   * @param {User} user
   * @returns {Promise<void>}
   * @throws {ExamSessionTakenError}
   */
  public async verifyExamSessionNotTaken(exam: Exam, user: User): Promise<void> {
    const existing = await this.examSessionRepository.findOneByExamAndOwnerWithoutCompleted(exam, user)

    if (existing) {
      throw new ExamSessionTakenError(existing)
    }
  }
}
