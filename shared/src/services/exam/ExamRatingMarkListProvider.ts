import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import Exam from '../../entities/exam/Exam'
import ExamRatingMarkRepository from '../../repositories/exams/ExamRatingMarkRepository'
import ExamRatingMark from '../../entities/exam/ExamRatingMark'

@Service()
export default class ExamRatingMarkListProvider {
  public constructor(@Inject() private readonly examRatingMarkRepository: ExamRatingMarkRepository) {}

  /**
   * @param {Exam[]} exams
   * @param {User} initiator
   * @returns {Promise<ExamSession[]>}
   */
  public async getExamRatingMarks(exams: Exam[], initiator: User): Promise<ExamRatingMark[]> {
    return await this.examRatingMarkRepository.findByExamsAndCreator(exams, initiator)
  }
}
