import { ObjectId } from 'bson'

export default class QuestionNotFoundError extends Error {
  public constructor(id: ObjectId | string) {
    super(`Question with id="${id.toString()}" not found error`)
  }
}
