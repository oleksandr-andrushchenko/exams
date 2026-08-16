export const getExam = (variables: any, _fields: string[] = []) => ({
  method: 'GET',
  path: '/exams/' + variables.examId,
  field: 'exam',
  fields: _fields
})
