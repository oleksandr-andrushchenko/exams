export const getQuestions = (variables: any = {}, _fields: string[] = []) => ({
  method: 'GET',
  path: '/questions',
  query: variables,
  field: 'questions',
  fields: _fields
})
