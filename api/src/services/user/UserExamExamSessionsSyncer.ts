import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import UserRepository from '../../repositories/UserRepository'
import ExamSessionRepository from '../../repositories/ExamSessionRepository'

@Service()
export default class UserExamExamSessionsSyncer {

  public constructor(
    @Inject() private readonly examSessionRepository: ExamSessionRepository,
    @Inject() private readonly userRepository: UserRepository,
  ) {
  }

  public async syncUserExamExamSessions(user: User): Promise<User> {
    const examSessions = await this.examSessionRepository.findByCreatorWithoutCompleted(user)

    const examExamSessions = {}

    for (const examSession of examSessions) {
      examExamSessions[examSession.examId.toString()] = examSession.id
    }

    await this.userRepository.updateOneByEntity(user, { examExamSessions, updatedAt: new Date() })

    return user
  }
}