import CreateUser from '../../../../src/schema/user/CreateUser'

export const createUser = (variables: { createUser: CreateUser }, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      mutation CreateUser($createUser: CreateUser!) {
        createUser(createUser: $createUser) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}