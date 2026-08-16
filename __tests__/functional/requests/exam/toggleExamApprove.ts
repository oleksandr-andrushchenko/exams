export const toggleExamApprove = (variables: any, _fields: string[] = []) => ({
  method: 'POST',
  path: '/exams/' + variables.examId + '/approve',
  field: 'toggleExamApprove',
  fields: _fields
})
