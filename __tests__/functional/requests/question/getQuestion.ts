export const getQuestion = (variables: any, _fields: string[] = []) => ({
  method: 'GET',
  path: '/questions/' + variables.questionId,
  field: 'question',
  fields: _fields
})
