import Repository from '../../database/Repository'
import EntityRepository from '../../database/EntityRepository'
import ExamTag from '../../entities/examTag/ExamTag'

@Repository(ExamTag)
export default class TagRepository extends EntityRepository<ExamTag> {
  public async getTag(slug: string): Promise<ExamTag | null> {
    return this.manager.findOne(ExamTag, { where: { slug } })
  }

  public async getExamTags(size = 100): Promise<ExamTag[]> {
    return this.manager.find(ExamTag, { take: size, order: { name: 'ASC' } })
  }

  public async getExamsCount(tag: ExamTag): Promise<number> {
    return this.createQueryBuilder('tag')
      .innerJoin('tag.exams', 'exam')
      .where('tag.id = :id', { id: tag.id })
      .getCount()
  }
}
