import Repository from '../decorators/Repository'
import ExamSession from '../entities/examSession/ExamSession'
import EntityRepository from './EntityRepository'
import User from '../entities/user/User'
import Exam from '../entities/exam/Exam'

@Repository(ExamSession)
export default class ExamSessionRepository extends EntityRepository<ExamSession> {
  public async findOneByExamAndOwnerWithoutCompleted(exam: Exam, owner: User): Promise<ExamSession | null> {
    return await this.findOneBy({
      examId: exam.id,
      ownerId: owner.id,
      completedAt: { $exists: false }
    })
  }

  public async findByExamsAndOwnerWithoutCompleted(exams: Exam[], owner: User): Promise<ExamSession[]> {
    return await this.findBy({
      examId: { $in: exams.map((exam) => exam.id) },
      ownerId: owner.id,
      completedAt: { $exists: false }
    })
  }

  public async findByCreatorWithoutCompleted(creator: User): Promise<ExamSession[]> {
    return await this.findBy({
      creatorId: creator.id,
      completedAt: { $exists: false }
    })
  }
}
