export const deleteExamSession = (variables: any) => ({
  method: 'DELETE',
  path: '/exam-sessions/' + variables.examSessionId,
  field: 'deleteExamSession'
})
