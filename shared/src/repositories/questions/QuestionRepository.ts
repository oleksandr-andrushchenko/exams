import { ObjectId } from 'bson'
import Repository from '../../database/Repository'
import Question from '../../entities/question/Question'
import EntityRepository from '../../database/EntityRepository'
import Exam from '../../entities/exam/Exam'
import { Container } from 'typedi'
import ExamRepository from '../exams/ExamRepository'

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

  private async addExams(rows: Question[]): Promise<Question[]> {
    const exams = Container.get(ExamRepository)
    return Promise.all(
      rows.map(async (question) =>
        Object.assign(question, {
          exam: question.examId ? await exams.getExam(question.examId.toString()) : undefined
        })
      )
    )
  }

  public async getQuestions(size = 50): Promise<Question[]> {
    const rows = await this.find({ take: size, order: { id: 'DESC' } })
    return this.addExams(rows)
  }

  public async getPopularQuestions(size = 50): Promise<Question[]> {
    return this.getQuestions(size)
  }

  public async getQuestion(value: string): Promise<Question | null> {
    const id = ObjectId.isValid(value) ? new ObjectId(value) : undefined
    return (id ? await this.findOneBy({ id }) : null) ?? (await this.findOneBy({ slug: value }))
  }
}
