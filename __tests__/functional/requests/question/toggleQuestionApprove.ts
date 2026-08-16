export const toggleQuestionApprove = (variables: any, _fields: string[] = []) => ({
  method: 'POST',
  path: '/questions/' + variables.questionId + '/approve',
  field: 'toggleQuestionApprove',
  fields: _fields
})
