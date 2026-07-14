import { Service } from 'typedi'
import Category from '../../entities/category/Category'
import User from '../../entities/user/User'
import { ObjectId } from 'mongodb'

@Service()
export default class CategoryExamIdProvider {

  public getCategoryExamId(category: Category, initiator: User): ObjectId | undefined {
    const categoryIdExamIds = initiator.categoryExams

    if (!categoryIdExamIds) {
      return undefined
    }

    const categoryIdKey = category.id.toString()

    if (categoryIdKey in categoryIdExamIds) {
      if (typeof categoryIdExamIds[categoryIdKey] === 'string') {
        return new ObjectId(categoryIdExamIds[categoryIdKey])
      }

      return categoryIdExamIds[categoryIdKey]
    }

    return undefined
  }
}