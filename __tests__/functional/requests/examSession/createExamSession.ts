export const createExamSession = (variables: any, _fields: string[] = []) => ({
  method: 'POST',
  path: '/exam-sessions',
  body: variables.createExamSession,
  field: 'createExamSession',
  fields: _fields
})
