import Exam from '../../entities/exam/Exam'

export default class ExamWithoutApprovedQuestionsError extends Error {
  public constructor(exam: Exam) {
    super(`Exam "${exam.id.toString()}" does not have approved questions`)
  }
}
