import ExamRatingMark from '../../entities/exam/ExamRatingMark'
import EntityRepository from '../EntityRepository'
import Repository from '../../decorators/Repository'
import Exam from '../../entities/exam/Exam'
import User from '../../entities/user/User'

@Repository(ExamRatingMark)
export default class ExamRatingMarkRepository extends EntityRepository<ExamRatingMark> {

  public async countByExam(exam: Exam): Promise<number> {
    return await this.countBy({ examId: exam.id })
  }

  public async sumByExam(exam: Exam): Promise<number> {
    return await this.sumBy('mark', { examId: exam.id })
  }

  public async findByCreator(creator: User): Promise<ExamRatingMark[]> {
    return await this.findBy({ creatorId: creator.id })
  }

  public async findByExamsAndCreator(exams: Exam[], creator: User): Promise<ExamRatingMark[]> {
    return await this.findBy({
      examId: { $in: exams.map(exam => exam.id) },
      creatorId: creator.id,
    })
  }

  public async findOneByExamAndCreator(exam: Exam, creator: User): Promise<ExamRatingMark | null> {
    return await this.findOneBy({
      examId: exam.id,
      creatorId: creator.id,
    })
  }
}