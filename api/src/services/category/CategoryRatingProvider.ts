import { Service } from 'typedi'
import Category from '../../entities/category/Category'
import RatingSchema from '../../schema/rating/RatingSchema'
import User from '../../entities/user/User'

@Service()
export default class CategoryRatingProvider {

  public getCategoryRating(category: Category, initiator?: User): RatingSchema | undefined {
    if (!category.rating) {
      return undefined
    }

    const rating = new RatingSchema()

    rating.averageMark = category.rating.averageMark
    rating.markCount = category.rating.markCount

    if (initiator && Array.isArray(initiator.categoryRatingMarks)) {
      const categoryId = category.id.toString()

      for (let index = 0; index < 5; index++) {
        const categoryIds = initiator.categoryRatingMarks[index].map(category => category.toString())

        if (Array.isArray(categoryIds) && categoryIds.includes(categoryId)) {
          rating.mark = index + 1
          break
        }
      }
    }

    return rating
  }
}