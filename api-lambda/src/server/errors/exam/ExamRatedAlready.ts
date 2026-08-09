import Exam from '../../entities/exam/Exam'

export default class ExamRatedAlready extends Error {
  public constructor(exam: Exam) {
    super(`Exam "${exam.name}" is already marked`)
  }
}
