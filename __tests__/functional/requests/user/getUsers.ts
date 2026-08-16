export const getUsers = (variables: any = {}, _fields: string[] = []) => ({
  method: 'GET',
  path: '/users',
  query: variables,
  field: 'users',
  fields: _fields
})
