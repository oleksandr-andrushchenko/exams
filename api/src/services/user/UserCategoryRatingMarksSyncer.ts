import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import UserRepository from '../../repositories/UserRepository'
import CategoryRatingMarkRepository from '../../repositories/category/CategoryRatingMarkRepository'

@Service()
export default class UserCategoryRatingMarksSyncer {

  public constructor(
    @Inject() private readonly categoryRatingMarkRepository: CategoryRatingMarkRepository,
    @Inject() private readonly userRepository: UserRepository,
  ) {
  }

  public async syncUserCategoryRatingMarks(user: User): Promise<User> {
    const ratingMarks = await this.categoryRatingMarkRepository.findByCreator(user)

    const categoryRatingMarks = []

    for (let index = 0; index < 5; index++) {
      categoryRatingMarks[index] = []
    }

    for (const ratingMark of ratingMarks) {
      categoryRatingMarks[ratingMark.mark - 1].push(ratingMark.categoryId)
    }

    await this.userRepository.updateOneByEntity(user, { categoryRatingMarks, updatedAt: new Date() })

    return user
  }
}