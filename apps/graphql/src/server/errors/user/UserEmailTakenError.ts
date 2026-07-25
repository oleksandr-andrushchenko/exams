export default class UserEmailTakenError extends Error {

  public constructor(email: string) {
    super(`Email "${ email }" is already taken`)
  }
}