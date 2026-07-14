export default class UserEmailNotFoundError extends Error {

  public constructor(email: string) {
    super(`User with email="${ email }" not found error`)
  }
}