import { Service } from 'typedi'
import Exam from '../../entities/exam/Exam'
import RatingSchema from '../../schema/rating/RatingSchema'
import User from '../../entities/user/User'

@Service()
export default class ExamRatingProvider {

  public getExamRating(exam: Exam, initiator?: User): RatingSchema | undefined {
    if (!exam.rating) {
      return undefined
    }

    const rating = new RatingSchema()

    rating.averageMark = exam.rating.averageMark
    rating.markCount = exam.rating.markCount

    if (initiator && Array.isArray(initiator.examRatingMarks)) {
      const examId = exam.id.toString()

      for (let index = 0; index < 5; index++) {
        const examIds = initiator.examRatingMarks[index].map(exam => exam.toString())

        if (Array.isArray(examIds) && examIds.includes(examId)) {
          rating.mark = index + 1
          break
        }
      }
    }

    return rating
  }
}