export const createExamSessionQuestionAnswer = (variables: any, _fields: string[] = []) => ({
  method: 'POST',
  path: '/exam-sessions/' + variables.examSessionId + '/questions/' + variables.question + '/answer',
  body: variables.createExamSessionQuestionAnswer,
  field: 'createExamSessionQuestionAnswer',
  fields: _fields
})
