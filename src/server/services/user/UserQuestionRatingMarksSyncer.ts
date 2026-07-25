import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import UserRepository from '../../repositories/UserRepository'
import QuestionRatingMarkRepository from '../../repositories/question/QuestionRatingMarkRepository'

@Service()
export default class UserQuestionRatingMarksSyncer {

  public constructor(
    @Inject() private readonly questionRatingMarkRepository: QuestionRatingMarkRepository,
    @Inject() private readonly userRepository: UserRepository,
  ) {
  }

  public async syncUserQuestionRatingMarks(user: User): Promise<User> {
    const ratingMarks = await this.questionRatingMarkRepository.findByCreator(user)

    const questionRatingMarks = []

    for (let index = 0; index < 5; index++) {
      questionRatingMarks[index] = []
    }

    for (const ratingMark of ratingMarks) {
      questionRatingMarks[ratingMark.mark - 1].push(ratingMark.questionId)
    }

    await this.userRepository.updateOneByEntity(user, { questionRatingMarks, updatedAt: new Date() })

    return user
  }
}