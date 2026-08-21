import { ObjectId } from 'bson'
import Exam from '../../entities/exam/Exam'
import Repository from '../../database/Repository'
import EntityRepository from '../../database/EntityRepository'
import User from '../../entities/user/User'
import isObjectId from '../../database/isObjectId'

@Repository(Exam)
export default class ExamRepository extends EntityRepository<Exam> {
  public async findOneByName(name: string): Promise<Exam | null> {
    return await this.findOneBy({ name })
  }

  public async findByCreator(creator: User): Promise<Exam[]> {
    return await this.findBy({ creatorId: creator.id })
  }

  public async findByOwner(owner: User): Promise<Exam[]> {
    return await this.findBy({
      ownerId: owner.id
    })
  }

  public async getExams(size = 50): Promise<Exam[]> {
    return this.find({ take: size, order: { id: 'DESC' } })
  }

  public async getPopularExams(size = 50): Promise<Exam[]> {
    return this.getExams(size)
  }

  public async getExam(value: string): Promise<Exam | null> {
    const id = isObjectId(value) ? value : undefined
    const exam = (id ? await this.findOneBy({ id }) : null) ?? (await this.findOneBy({ slug: value }))
    if (!exam) return null
    return exam
  }
}
