import Repository from '../../decorators/Repository'
import Question from '../../entities/question/Question'
import EntityRepository from '../EntityRepository'
import Exam from '../../entities/exam/Exam'

@Repository(Question)
export default class QuestionRepository extends EntityRepository<Question> {

  public async findOneByTitle(title: string): Promise<Question | null> {
    return await this.findOneBy({ title })
  }

  public async countByExam(exam: Exam): Promise<number> {
    return await this.countBy({ examId: exam.id })
  }

  public async findByExamWithoutOwner(exam: Exam): Promise<Question[]> {
    return await this.findBy({ examId: exam.id, ownerId: { $exists: false } })
  }

  public async countByExamWithoutOwner(exam: Exam): Promise<number> {
    return await this.countBy({ examId: exam.id, ownerId: { $exists: false } })
  }
}