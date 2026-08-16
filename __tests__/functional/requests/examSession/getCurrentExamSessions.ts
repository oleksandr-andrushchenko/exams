export const getCurrentExamSessions = (variables: any, _fields: string[] = []) => ({
  method: 'GET',
  path: '/exam-sessions/current',
  query: { examIds: variables.examIds },
  field: 'currentExamSessions',
  fields: _fields
})
