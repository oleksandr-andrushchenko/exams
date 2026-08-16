export const getExamSession = (variables: any, _fields: string[] = []) => ({
  method: 'GET',
  path: '/exam-sessions/' + variables.examSessionId,
  field: 'examSession',
  fields: _fields
})
