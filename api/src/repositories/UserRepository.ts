import User from '../entities/user/User'
import Repository from '../decorators/Repository'
import EntityRepository from './EntityRepository'
import { RatingMarkTargetConstructorType } from '../types/rating/RatingMarkTargetConstructorType'
import { ObjectId } from 'bson'

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
  ): Promise<User> {
    return await this.updateOneByEntity(user, { [`${ targetConstructor.name.toLowerCase() }RatingMarks`]: value, ...set })
  }
}