export const createExamSessionCompletion = (variables: any, _fields: string[] = []) => ({
  method: 'POST',
  path: '/exam-sessions/' + variables.examSessionId + '/completion',
  field: 'createExamSessionCompletion',
  fields: _fields
})
