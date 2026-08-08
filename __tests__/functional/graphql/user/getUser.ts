export const getUser = (userId: string, fields: string[] = ['id', 'name', 'createdAt', 'updatedAt']) => ({
  query: `
    query GetUser($userId: ID!) {
      user(userId: $userId) {
        ${fields.join('\n')}
      }
    }
  `,
  variables: { userId }
})
