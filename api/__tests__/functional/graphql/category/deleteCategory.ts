import GetCategory from '../../../../src/schema/category/GetCategory'

export const deleteCategory = (variables: GetCategory) => {
  return {
    query: `
      mutation DeleteCategory($categoryId: ID!) {
        deleteCategory(categoryId: $categoryId)
      }
  `,
    variables,
  }
}