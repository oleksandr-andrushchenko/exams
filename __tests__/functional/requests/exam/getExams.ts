export const getExams = (variables: any = {}, _fields: string[] = []) => ({
  method: 'GET',
  path: '/exams',
  query: variables,
  field: 'exams',
  fields: _fields
})
