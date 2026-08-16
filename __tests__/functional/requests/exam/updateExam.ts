export const updateExam = (variables: any, _fields: string[] = []) => ({
  method: 'PATCH',
  path: '/exams/' + variables.examId,
  body: variables.updateExam,
  field: 'updateExam',
  fields: _fields
})
