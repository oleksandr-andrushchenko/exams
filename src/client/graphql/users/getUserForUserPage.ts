import { gql } from '@apollo/client'

export default function getUserForUserPage(userId: string): any {
  return {
    query: gql`
      query GetUserForUserPage($userId: ID!) {
        user(userId: $userId) {
          id
          name
          createdAt
          updatedAt
        }
      }
    `,
    variables: { userId },
  }
}
