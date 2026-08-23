import { ObjectId } from 'bson'

export default class ExamTagNotFoundError extends Error {
  public constructor(id: ObjectId | string) {
    super(`Exam tag with id="${ id.toString() }" not found error`)
  }
}
