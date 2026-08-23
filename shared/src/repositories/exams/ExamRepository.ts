import { ObjectId } from 'bson'
import Exam from '../../entities/exam/Exam'
import Repository from '../../database/Repository'
import EntityRepository from '../../database/EntityRepository'
import User from '../../entities/user/User'

@Repository(Exam)
export default class ExamRepository extends EntityRepository<Exam> {
  public async findOneByName(name: string): Promise<Exam | null> {
    return await this.findOneBy({ name })
  }

  public async findByCreatorId(creatorId: ObjectId | string): Promise<Exam[]> {
    return await this.findBy({ creatorId })
  }

  public async findLastExams(size: number = 20, page: number = 1): Promise<Exam[]> {
    return this.findLast(size, page)
  }

  public async findPopularExams(size: number = 20, page: number = 1): Promise<Exam[]> {
    return this.findFirst(size, page)
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
}
