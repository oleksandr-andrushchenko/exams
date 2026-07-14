import { Inject, Service } from 'typedi'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import Rating from '../../entities/rating/Rating'
import Question from '../../entities/question/Question'
import QuestionRatingMarkRepository from '../../repositories/question/QuestionRatingMarkRepository'

@Service()
export default class QuestionRatingSyncer {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly questionRatingMarkRepository: QuestionRatingMarkRepository,
  ) {
  }

  public async syncQuestionRating(question: Question): Promise<Question> {
    const markCount = await this.questionRatingMarkRepository.countByQuestion(question)
    const markSum = await this.questionRatingMarkRepository.sumByQuestion(question)

    question.rating = new Rating()
    question.rating.markCount = markCount
    question.rating.averageMark = markSum / markCount
    question.updatedAt = new Date()

    await this.entityManager.save<Question>(question)

    return question
  }
}