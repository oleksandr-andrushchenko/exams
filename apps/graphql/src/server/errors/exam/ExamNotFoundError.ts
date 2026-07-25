import { ObjectId } from 'bson'

export default class ExamNotFoundError extends Error {

  public constructor(id: ObjectId) {
    super(`Exam with id="${ id.toString() }" not found error`)
  }
}