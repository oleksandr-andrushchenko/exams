export const deleteExam = (variables: any) => ({
  method: 'DELETE',
  path: '/exams/' + variables.examId,
  field: 'deleteExam'
})
