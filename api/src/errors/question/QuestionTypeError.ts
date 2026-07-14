export default class QuestionTypeError extends Error {

  public constructor(type: string) {
    super(`Type "${ type }" is invalid`)
  }
}