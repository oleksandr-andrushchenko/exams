import GetUsers from '../../../../src/schema/user/GetUsers'

export const getUsers = (variables: GetUsers = {}, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      query GetUsers($search: String, $prevCursor: String, $cursor: String, $nextCursor: String, $size: Int, $order: String) {
        users(search: $search, prevCursor: $prevCursor, cursor: $cursor, nextCursor: $nextCursor, size: $size, order: $order) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}