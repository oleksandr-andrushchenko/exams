export const updateUser = (variables: any, _fields: string[] = []) => ({
  method: 'PATCH',
  path: '/users/' + variables.userId,
  body: variables.updateUser,
  field: 'updateUser',
  fields: _fields
})
