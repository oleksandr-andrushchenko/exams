import User from '../entities/user/User'
import Repository from '../decorators/Repository'
import EntityRepository from './EntityRepository'
import { Document } from 'typeorm/driver/mongodb/typings'
import { UpdateResult } from 'typeorm/query-builder/result/UpdateResult'
import { RatingMarkTargetConstructorType } from '../types/rating/RatingMarkTargetConstructorType'
import { ObjectId } from 'mongodb'

@Repository(User)
export default class UserRepository extends EntityRepository<User> {

  public async findOneByEmail(email: string): Promise<User | null> {
    return await this.findOneBy({ email })
  }

  public async updateRatingMarks(
    user: User,
    targetConstructor: RatingMarkTargetConstructorType,
    value: ObjectId[][],
    set: Partial<User> = {},
  ): Promise<Document | UpdateResult> {
    return await this.updateOneByEntity(user, { [`${ targetConstructor.name.toLowerCase() }RatingMarks`]: value, ...set })
  }
}