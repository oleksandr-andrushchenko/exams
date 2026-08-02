import { Service } from 'typedi'
import Question from '../../entities/question/Question'
import RatingSchema from '../../schema/rating/RatingSchema'
import User from '../../entities/user/User'
import RatingTemplateRenderer from '../rating/RatingTemplateRenderer'

@Service()
export default class QuestionRatingProvider {

  private readonly ratingTemplateRenderer = new RatingTemplateRenderer()

  public getQuestionRating(question: Question, initiator: User): RatingSchema | undefined {
    if (!question.rating) {
      return undefined
    }

    const rating = new RatingSchema()

    rating.averageMark = question.rating.averageMark
    rating.markCount = question.rating.markCount

    if (initiator && Array.isArray(initiator.questionRatingMarks)) {
      const questionId = question.id.toString()

      for (let index = 0; index < 5; index++) {
        const questionIds = initiator.questionRatingMarks[index].map(question => question.toString())

        if (Array.isArray(questionIds) && questionIds.includes(questionId)) {
          rating.mark = index + 1
          break
        }
      }
    }

    rating.html = this.ratingTemplateRenderer.render({ questionId: question.id.toString(), rating, userMark: rating.mark })

    return rating
  }
}