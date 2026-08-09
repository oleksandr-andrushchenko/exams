import { ILike, Repository as TypeOrmRepository } from 'typeorm'
import ExamTag from '../../entities/examTag/ExamTag'
import Repository from '../../decorators/Repository'
import Exam from '../../entities/exam/Exam'

@Repository(ExamTag)
export default class ExamTagRepository extends TypeOrmRepository<ExamTag> {
  public findForExam(exam: Exam): Promise<ExamTag[]> {
    return this.createQueryBuilder('tag')
      .innerJoin('tag.exams', 'exam', 'exam.id = :examId', { examId: exam.id.toString() })
      .orderBy('tag.name', 'ASC')
      .getMany()
  }

  public async findExamIdsBySlug(slug: string): Promise<string[]> {
    const rows = await this.createQueryBuilder('tag')
      .innerJoin('tag.exams', 'exam')
      .select('exam.id', 'id')
      .where('tag.slug = :slug', { slug })
      .getRawMany()
    return rows.map((row) => row.id)
  }

  public findMatching(search: string = '', size: number = 20): Promise<ExamTag[]> {
    return this.find({
      where: search ? [{ name: ILike(`%${search}%`) }, { slug: ILike(`%${search}%`) }] : {},
      order: { rating: 'DESC', name: 'ASC' },
      take: size
    })
  }

  public async countExams(tag: ExamTag): Promise<number> {
    const result = await this.createQueryBuilder('tag')
      .innerJoin('tag.exams', 'exam')
      .select('COUNT(exam.id)', 'count')
      .where('tag.id = :tagId', { tagId: tag.id.toString() })
      .getRawOne()
    return Number(result.count)
  }
}
