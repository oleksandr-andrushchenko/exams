import { ObjectId } from 'bson'

export default class ExamSessionNotFoundError extends Error {
  public constructor(id: ObjectId) {
    super(`ExamSession with id="${id.toString()}" not found error`)
  }
}
