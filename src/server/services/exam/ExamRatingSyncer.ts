import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import Rating from '../../entities/rating/Rating'
import ExamRatingMarkRepository from '../../repositories/exam/ExamRatingMarkRepository'
import Exam from '../../entities/exam/Exam'

@Service()
export default class ExamRatingSyncer {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly examRatingMarkRepository: ExamRatingMarkRepository,
  ) {
  }

  public async syncExamRating(exam: Exam): Promise<Exam> {
    const markCount = await this.examRatingMarkRepository.countByExam(exam)
    const markSum = await this.examRatingMarkRepository.sumByExam(exam)

    exam.rating = new Rating()
    exam.rating.markCount = markCount
    exam.rating.averageMark = markSum / markCount
    exam.updatedAt = new Date()

    await this.entityManager.save<Exam>(exam)

    return exam
  }
}