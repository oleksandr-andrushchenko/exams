import GetUser from '../../../../api-lambda/src/server/schema/user/GetUser'

export const deleteUser = (variables: GetUser) => {
  return {
    query: `
      mutation DeleteUser($userId: ID!) {
        deleteUser(userId: $userId)
      }
  `,
    variables
  }
}
