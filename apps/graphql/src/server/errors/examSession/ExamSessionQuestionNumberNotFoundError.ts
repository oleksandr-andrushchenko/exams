export default class ExamSessionQuestionNumberNotFoundError extends Error {
  public constructor(number: number) {
    super(`Question with number="${number}" not found error`)
  }
}
