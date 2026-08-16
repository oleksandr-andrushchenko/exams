export const createUser = (variables: any, _fields: string[] = []) => ({
  method: 'POST',
  path: '/users',
  body: variables.createUser,
  field: 'createUser',
  fields: _fields
})
