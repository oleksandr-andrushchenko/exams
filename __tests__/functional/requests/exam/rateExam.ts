export const rateExam = (variables: any, _fields: string[] = []) => ({
  method: 'POST',
  path: '/exams/' + variables.examId + '/rating',
  body: { mark: variables.mark },
  field: 'rateExam',
  fields: _fields
})
