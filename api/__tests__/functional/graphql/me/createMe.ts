import CreateMe from '../../../../src/schema/user/CreateMe'

export const createMe = (variables: { createMe: CreateMe }, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      mutation CreateMe($createMe: CreateMe!) {
        createMe(createMe: $createMe) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}