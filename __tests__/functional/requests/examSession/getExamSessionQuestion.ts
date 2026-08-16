export const getExamSessionQuestion = (variables: any, _fields: string[] = []) => ({
  method: 'GET',
  path: '/exam-sessions/' + variables.examSessionId + '/questions/' + variables.question,
  field: 'examSessionQuestion',
  fields: _fields
})
