import { ObjectId } from 'mongodb'

export default class QuestionNotFoundError extends Error {

  public constructor(id: ObjectId) {
    super(`Question with id="${ id.toString() }" not found error`)
  }
}