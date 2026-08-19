import { ObjectId } from 'bson'

export default class UserNotFoundError extends Error {
  public constructor(id: ObjectId | string) {
    super(`User with id="${id.toString()}" not found error`)
  }
}
