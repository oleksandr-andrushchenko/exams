import Permission from '../../enums/Permission'

export default class AuthorizationFailedError extends Error {

  public constructor(permission: string) {
    super(`Permission with id="${ permission }" authorization error`)
  }
}