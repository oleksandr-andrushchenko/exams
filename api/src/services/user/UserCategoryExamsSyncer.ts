import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import UserRepository from '../../repositories/UserRepository'
import ExamRepository from '../../repositories/ExamRepository'

@Service()
export default class UserCategoryExamsSyncer {

  public constructor(
    @Inject() private readonly examRepository: ExamRepository,
    @Inject() private readonly userRepository: UserRepository,
  ) {
  }

  public async syncUserCategoryExams(user: User): Promise<User> {
    const exams = await this.examRepository.findByCreatorWithoutCompleted(user)

    const categoryExams = {}

    for (const exam of exams) {
      categoryExams[exam.categoryId.toString()] = exam.id
    }

    await this.userRepository.updateOneByEntity(user, { categoryExams, updatedAt: new Date() })

    return user
  }
}