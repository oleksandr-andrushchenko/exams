import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import ExamSessionRepository from '../../repositories/ExamSessionRepository'
import ExamSession from '../../entities/examSession/ExamSession'
import Exam from '../../entities/exam/Exam'

@Service()
export default class CurrentExamSessionListProvider {
  public constructor(@Inject() private readonly examSessionRepository: ExamSessionRepository) {}

  /**
   * @param {Exam[]} exams
   * @param {User} initiator
   * @returns {Promise<ExamSession[]>}
   */
  public async getCurrentExamSessions(exams: Exam[], initiator: User): Promise<ExamSession[]> {
    return await this.examSessionRepository.findByExamsAndOwnerWithoutCompleted(exams, initiator)
  }
}
