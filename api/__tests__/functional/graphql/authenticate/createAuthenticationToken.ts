import { Credentials } from '../../../../src/schema/auth/Credentials'

export const createAuthenticationToken = (variables: { credentials: Credentials }, fields: string[] = [ 'token' ]) => {
  return {
    query: `
      mutation CreateAuthenticationToken($credentials: Credentials!) {
        createAuthenticationToken(credentials: $credentials) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}