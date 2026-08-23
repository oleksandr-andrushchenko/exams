import User from '../../entities/user/User'
import Repository from '../../database/Repository'
import EntityRepository from '../../database/EntityRepository'
import { RatingMarkTargetConstructorType } from '../../types/rating/RatingMarkTargetConstructorType'
import { ObjectId } from 'bson'
import isObjectId from '../../database/isObjectId'
import { ArrayContains } from 'typeorm'

@Repository(User)
export default class UserRepository extends EntityRepository<User> {
  public async findOneByEmail(email: string): Promise<User | null> {
    return await this.findOneBy({ email })
  }

  public async findRootUser(): Promise<User | null> {
    return await this.findOneBy({ permissions: ArrayContains([ 'root' ]) })
  }

  public async updateRatingMarks(
    user: User,
    targetConstructor: RatingMarkTargetConstructorType,
    value: ObjectId[][],
    set: Partial<User> = {}
  ): Promise<User> {
    return await this.updateOneByEntity(user, { [`${ targetConstructor.name.toLowerCase() }RatingMarks`]: value, ...set })
  }

  public async getUser(value: string): Promise<User | null> {
    const id = isObjectId(value) ? value : undefined
    return (id ? await this.findOneBy({ id }) : null) ?? (await this.findOneBy({ slug: value }))
  }

  public async findOneBySlug(slug: string): Promise<User | null> {
    return await this.findOneBy({ slug })
  }

  public async getUserCredentials(email: string): Promise<User | null> {
    return this.findOneByEmail(email)
  }

  public async findLastUsers(size: number = 20, page: number = 1): Promise<User[]> {
    return this.findLast(size, page)
  }

  public async findPopularUsers(size: number = 20, page: number = 1): Promise<User[]> {
    return this.findFirst(size, page)
  }
}
