export default class ExamQuestionNumberNotFoundError extends Error {

  public constructor(number: number) {
    super(`Question with number="${ number }" not found error`)
  }
}