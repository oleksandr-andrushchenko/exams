import { Service } from 'typedi'
import RatingSchema from '../../schema/rating/RatingSchema'
import User from '../../entities/user/User'

@Service()
export default class UserRatingProvider {
  public async getUserRating(user: User): Promise<RatingSchema | undefined> {
    if (!user.rating) return undefined
    const rating = new RatingSchema()
    rating.averageMark = user.rating.averageMark
    rating.markCount = user.rating.markCount
    return rating
  }
}
