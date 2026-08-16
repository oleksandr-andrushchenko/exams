export const createMe = (variables: any, _fields: string[] = []) => ({
  method: 'POST',
  path: '/me',
  body: variables.createMe,
  field: 'createMe',
  fields: _fields
})
