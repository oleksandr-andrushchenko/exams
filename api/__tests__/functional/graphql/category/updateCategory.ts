import UpdateCategory from '../../../../src/schema/category/UpdateCategory'
import GetCategory from '../../../../src/schema/category/GetCategory'

export const updateCategory = (variables: GetCategory & {
  updateCategory: UpdateCategory
}, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      mutation UpdateCategory($categoryId: ID!, $updateCategory: UpdateCategory!) {
        updateCategory(categoryId: $categoryId, updateCategory: $updateCategory) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}