export default class AuthenticationFailedError extends Error {
  public constructor() {
    super(`Authentication required`)
  }
}
