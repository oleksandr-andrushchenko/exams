import ExamSession from '../../entities/examSession/ExamSession'

export default class ExamSessionTakenError extends Error {
  public constructor(examSession: ExamSession) {
    super(`ExamSession "${examSession.examId.toString()}" is already taken`)
  }
}
