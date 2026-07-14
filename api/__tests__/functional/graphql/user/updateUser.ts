import UpdateUser from '../../../../src/schema/user/UpdateUser'
import GetUser from '../../../../src/schema/user/GetUser'

export const updateUser = (variables: GetUser & { updateUser: UpdateUser }, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      mutation UpdateUser($userId: ID!, $updateUser: UpdateUser!) {
        updateUser(userId: $userId, updateUser: $updateUser) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}