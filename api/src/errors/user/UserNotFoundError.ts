import { ObjectId } from 'mongodb'

export default class UserNotFoundError extends Error {

  public constructor(id: ObjectId) {
    super(`User with id="${ id.toString() }" not found error`)
  }
}