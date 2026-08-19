import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import Rating from '../../entities/rating/Rating'
import Exam from '../../entities/exam/Exam'
import User from '../../entities/user/User'
import ExamRepository from '../../repositories/exams/ExamRepository'
import UserRepository from '../../repositories/users/UserRepository'

@Service()
export default class UserRatingSyncer {
  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly examRepository: ExamRepository,
    @Inject() private readonly userRepository: UserRepository
  ) {}

  public async syncUserRating(user: User): Promise<User> {
    const exams = await this.examRepository.findByCreator(user)
    const ratedExams = exams.filter((exam) => exam.rating && exam.rating.markCount > 0)
    const rating = new Rating()
    rating.markCount = ratedExams.reduce((sum, exam) => sum + (exam.rating?.markCount || 0), 0)
    rating.averageMark = rating.markCount
      ? ratedExams.reduce((sum, exam) => sum + (exam.rating?.averageMark || 0) * (exam.rating?.markCount || 0), 0) /
        rating.markCount
      : 0
    user.rating = rating
    user.updatedAt = new Date()
    await this.entityManager.save<User>(user)
    return user
  }

  public async syncUserRatingByExam(exam: Exam): Promise<User | undefined> {
    if (!exam.creatorId) return undefined
    const user = await this.userRepository.findOneById(exam.creatorId)
    return user ? this.syncUserRating(user) : undefined
  }
}
