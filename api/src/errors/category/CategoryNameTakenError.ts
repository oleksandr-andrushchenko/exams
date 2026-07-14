export default class CategoryNameTakenError extends Error {

  public constructor(name: string) {
    super(`Name "${ name }" is already taken`)
  }
}