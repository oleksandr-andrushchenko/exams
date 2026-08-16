export const createAuthenticationToken = (variables: any, _fields: string[] = []) => ({
  method: 'POST',
  path: '/auth/token',
  body: variables.credentials,
  field: 'createAuthenticationToken',
  fields: _fields
})
