import GetCategory from '../../../../src/schema/category/GetCategory'

export const getCategory = (variables: GetCategory, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      query GetCategory($categoryId: ID!) {
        category(categoryId: $categoryId) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}