import UpdateMe from '../../../../apps/graphql/src/server/schema/user/UpdateMe'

export const updateMe = (variables: { updateMe: UpdateMe }, fields: string[] = ['id']) => {
  return {
    query: `
      mutation UpdateMe($updateMe: UpdateMe!) {
        updateMe(updateMe: $updateMe) {
          ${fields.join('\r')}
        }
      }
  `,
    variables
  }
}
