export const deleteQuestion = (variables: any) => ({
  method: 'DELETE',
  path: '/questions/' + variables.questionId,
  field: 'deleteQuestion'
})
