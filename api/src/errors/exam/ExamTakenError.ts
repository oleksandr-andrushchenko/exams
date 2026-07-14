import Exam from '../../entities/exam/Exam'

export default class ExamTakenError extends Error {

  public constructor(exam: Exam) {
    super(`Exam "${ exam.categoryId.toString() }" is already taken`)
  }
}