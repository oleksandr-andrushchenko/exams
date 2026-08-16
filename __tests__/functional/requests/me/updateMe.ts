export const updateMe = (variables: any, _fields: string[] = []) => ({
  method: 'PATCH',
  path: '/me',
  body: variables.updateMe,
  field: 'updateMe',
  fields: _fields
})
