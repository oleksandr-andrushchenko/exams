import UpdateUser from '../../../../api-lambda/src/server/schema/user/UpdateUser'
import GetUser from '../../../../api-lambda/src/server/schema/user/GetUser'

export const updateUser = (variables: GetUser & { updateUser: UpdateUser }, fields: string[] = ['id']) => {
  return {
    query: `
      mutation UpdateUser($userId: ID!, $updateUser: UpdateUser!) {
        updateUser(userId: $userId, updateUser: $updateUser) {
          ${fields.join('\r')}
        }
      }
  `,
    variables
  }
}
