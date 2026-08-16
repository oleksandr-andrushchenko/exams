export const updateQuestion = (variables: any, _fields: string[] = []) => ({
  method: 'PATCH',
  path: '/questions/' + variables.questionId,
  body: variables.updateQuestion,
  field: 'updateQuestion',
  fields: _fields
})
