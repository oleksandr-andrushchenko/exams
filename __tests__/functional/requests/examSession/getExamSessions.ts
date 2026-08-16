export const getExamSessions = (variables: any = {}, _fields: string[] = []) => ({
  method: 'GET',
  path: '/exam-sessions',
  query: variables,
  field: 'examSessions',
  fields: _fields
})
