import Exam from '../../entities/exam/Exam'
import Repository from '../../decorators/Repository'
import EntityRepository from '../EntityRepository'
import User from '../../entities/user/User'

@Repository(Exam)
export default class ExamRepository extends EntityRepository<Exam> {

  public async findOneByName(name: string): Promise<Exam | null> {
    return await this.findOneBy({ name })
  }

  public async findByOwner(owner: User): Promise<Exam[]> {
    return await this.findBy({
      ownerId: owner.id,
    })
  }
}