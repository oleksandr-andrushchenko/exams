import User from '../../entities/user/User'
import Repository from '../../database/Repository'
import EntityRepository from '../../database/EntityRepository'
import { RatingMarkTargetConstructorType } from '../../types/rating/RatingMarkTargetConstructorType'
import { ObjectId } from 'bson'
import Exam from '../../entities/exam/Exam'
import ExamSession from '../../entities/examSession/ExamSession'
import isObjectId from '../../database/isObjectId'

@Repository(User)
export default class UserRepository extends EntityRepository<User> {
  public async findOneByEmail(email: string): Promise<User | null> {
    return await this.findOneBy({ email })
  }

  public async updateRatingMarks(
    user: User,
    targetConstructor: RatingMarkTargetConstructorType,
    value: ObjectId[][],
    set: Partial<User> = {}
  ): Promise<User> {
    return await this.updateOneByEntity(user, { [`${targetConstructor.name.toLowerCase()}RatingMarks`]: value, ...set })
  }

  public async getUser(value: string): Promise<User | null> {
    const id = isObjectId(value) ? value : undefined
    return (id ? await this.findOneBy({ id }) : null) ?? (await this.findOneBy({ slug: value }))
  }

  public async getUserCredentials(email: string): Promise<User | null> {
    return this.findOneByEmail(email)
  }

  public async getUserList(filters: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    const page = typeof filters.page === 'number' ? Math.max(1, filters.page) : 1
    const size = typeof filters.size === 'number' ? Math.min(50, Math.max(1, filters.size)) : 20
    const rows = await this.find({ take: page * size + 1, order: { id: 'DESC' } })
    return { data: rows.slice((page - 1) * size, page * size), page, size, hasNext: rows.length > page * size }
  }

  public async getPopularUsers(size = 50): Promise<User[]> {
    return this.find({ take: size, order: { id: 'DESC' } })
  }

  public async getUserExams(userId: string): Promise<Exam[]> {
    return this.manager.find(Exam, { where: { creatorId: new ObjectId(userId) } })
  }

  public async getUserExamSessions(userId: string): Promise<ExamSession[]> {
    return this.manager.find(ExamSession, { where: { creatorId: new ObjectId(userId) } })
  }
}
