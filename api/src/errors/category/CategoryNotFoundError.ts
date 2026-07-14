import { ObjectId } from 'mongodb'

export default class CategoryNotFoundError extends Error {

  public constructor(id: ObjectId) {
    super(`Category with id="${ id.toString() }" not found error`)
  }
}