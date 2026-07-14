export default class UserWrongCredentialsError extends Error {

  public constructor() {
    super('Passwords not matched')
  }
}