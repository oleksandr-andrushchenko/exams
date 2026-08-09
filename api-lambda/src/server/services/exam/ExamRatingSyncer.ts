import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import Rating from '../../entities/rating/Rating'
import Exam from '../../entities/exam/Exam'
import QuestionRepository from '../../repositories/question/QuestionRepository'

@Service()
export default class ExamRatingSyncer {
  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly questionRepository: QuestionRepository
  ) {}

  public async syncExamRating(exam: Exam): Promise<Exam> {
    const questions = await this.questionRepository.findByExamWithoutOwner(exam)
    const ratedQuestions = questions.filter((question) => question.rating && question.rating.markCount > 0)
    const markCount = ratedQuestions.reduce((total, question) => total + (question.rating?.markCount || 0), 0)
    const markSum = ratedQuestions.reduce(
      (total, question) => total + (question.rating?.averageMark || 0) * (question.rating?.markCount || 0),
      0
    )

    exam.rating = new Rating()
    exam.rating.markCount = markCount
    exam.rating.averageMark = markCount ? markSum / markCount : 0
    exam.updatedAt = new Date()

    await this.entityManager.save<Exam>(exam)

    return exam
  }
}
