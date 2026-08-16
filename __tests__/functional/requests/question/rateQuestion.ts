export const rateQuestion = (variables: any, _fields: string[] = []) => ({
  method: 'POST',
  path: '/questions/' + variables.questionId + '/rating',
  body: { mark: variables.mark },
  field: 'rateQuestion',
  fields: _fields
})
