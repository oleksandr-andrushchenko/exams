import GetUser from '../../../../src/schema/user/GetUser'

export const deleteUser = (variables: GetUser) => {
  return {
    query: `
      mutation DeleteUser($userId: ID!) {
        deleteUser(userId: $userId)
      }
  `,
    variables,
  }
}