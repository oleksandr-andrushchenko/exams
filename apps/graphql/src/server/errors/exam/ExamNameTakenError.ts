export default class ExamNameTakenError extends Error {

  public constructor(name: string) {
    super(`Name "${ name }" is already taken`)
  }
}