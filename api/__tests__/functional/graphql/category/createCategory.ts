import CreateCategory from '../../../../src/schema/category/CreateCategory'

export const createCategory = (variables: { createCategory: CreateCategory }, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      mutation CreateCategory($createCategory: CreateCategory!) {
        createCategory(createCategory: $createCategory) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}