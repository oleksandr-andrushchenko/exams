export const createQuestion = (variables: any, _fields: string[] = []) => ({
  method: 'POST',
  path: '/questions',
  body: variables.createQuestion,
  field: 'createQuestion',
  fields: _fields
})
