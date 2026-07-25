import { Service } from 'typedi'
import Question from '../../entities/question/Question'
import RatingSchema from '../../schema/rating/RatingSchema'
import User from '../../entities/user/User'

@Service()
export default class QuestionRatingProvider {

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

    return rating
  }
}