import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import UserRepository from '../../repositories/UserRepository'
import ExamRatingMarkRepository from '../../repositories/exam/ExamRatingMarkRepository'

@Service()
export default class UserExamRatingMarksSyncer {

  public constructor(
    @Inject() private readonly examRatingMarkRepository: ExamRatingMarkRepository,
    @Inject() private readonly userRepository: UserRepository,
  ) {
  }

  public async syncUserExamRatingMarks(user: User): Promise<User> {
    const ratingMarks = await this.examRatingMarkRepository.findByCreator(user)

    const examRatingMarks = []

    for (let index = 0; index < 5; index++) {
      examRatingMarks[index] = []
    }

    for (const ratingMark of ratingMarks) {
      if (ratingMark.mark > 0) {
        examRatingMarks[ratingMark.mark - 1].push(ratingMark.examId)
      }
    }

    await this.userRepository.updateOneByEntity(user, { examRatingMarks, updatedAt: new Date() })

    return user
  }
}