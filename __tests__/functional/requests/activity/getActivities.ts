export const getActivities = (variables: any = {}, _fields: string[] = []) => ({
  method: 'GET',
  path: '/activities',
  query: variables,
  field: 'activities',
  fields: _fields
})
