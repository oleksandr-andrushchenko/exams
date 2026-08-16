export const getUser = (userId: string, _fields: string[] = []) => ({
  method: 'GET',
  path: '/users/' + userId,
  field: 'user',
  fields: _fields
})
