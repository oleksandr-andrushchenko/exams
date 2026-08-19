import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import Exam from '../../entities/exam/Exam'
import ExamPermission from '../../enums/exam/ExamPermission'
import EventDispatcher from '../event/EventDispatcher'
import ExamEvent from '../../enums/exam/ExamEvent'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import ExamRatedAlready from '../../errors/exam/ExamRatedAlready'
import ExamRatingMarkRepository from '../../repositories/exams/ExamRatingMarkRepository'
import ExamRatingMark from '../../entities/exam/ExamRatingMark'

@Service()
export default class ExamRatingMarkCreator {
  public constructor(
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject() private readonly examRatingMarkRepository: ExamRatingMarkRepository,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface
  ) {}

  /**
   * @param {Exam} exam
   * @param {number} mark
   * @param {User} initiator
   * @returns {Promise<Exam>}
   * @throws {AuthorizationFailedError}
   */
  public async createExamRatingMark(exam: Exam, mark: number, initiator: User): Promise<Exam> {
    await this.authorizationVerifier.verifyAuthorization(initiator, ExamPermission.Rate, exam)

    const existingRatingMark = await this.examRatingMarkRepository.findOneByExamAndCreator(exam, initiator)

    if (existingRatingMark) {
      throw new ExamRatedAlready(exam)
    }

    const ratingMark = new ExamRatingMark()
    ratingMark.examId = exam.id
    ratingMark.mark = mark
    ratingMark.creatorId = initiator.id
    ratingMark.createdAt = new Date()

    await this.entityManager.save<ExamRatingMark>(ratingMark)
    await this.eventDispatcher.dispatch(ExamEvent.Rated, { exam, user: initiator })

    return exam
  }
}
