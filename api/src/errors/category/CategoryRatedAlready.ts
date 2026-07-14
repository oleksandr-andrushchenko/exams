import Category from '../../entities/category/Category'

export default class CategoryRatedAlready extends Error {

  public constructor(category: Category) {
    super(`Category "${ category.name }" is already marked`)
  }
}