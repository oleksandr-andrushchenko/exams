import Exam from '../../entities/exam/Exam'

export default class ExamNotApprovedError extends Error {
  public constructor(exam: Exam) {
    super(`Exam "${exam.id.toString()}" is not approved`)
  }
}
