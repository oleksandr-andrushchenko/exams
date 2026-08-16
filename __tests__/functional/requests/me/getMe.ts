export const getMe = (_variables: any = {}, _fields: string[] = []) => ({
  method: 'GET',
  path: '/me',
  field: 'me',
  fields: _fields
})
