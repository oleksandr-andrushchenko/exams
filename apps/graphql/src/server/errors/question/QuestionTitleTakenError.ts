export default class QuestionTitleTakenError extends Error {

  public constructor(title: string) {
    super(`Title "${ title }" is already taken`)
  }
}