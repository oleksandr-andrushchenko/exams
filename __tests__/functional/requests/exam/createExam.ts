export const createExam = (variables: any, _fields: string[] = []) => ({
  method: 'POST',
  path: '/exams',
  body: variables.createExam,
  field: 'createExam',
  fields: _fields
})
