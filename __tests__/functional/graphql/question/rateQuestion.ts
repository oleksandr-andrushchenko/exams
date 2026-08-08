import RateQuestionRequest from '../../../../apps/graphql/src/server/schema/question/RateQuestionRequest'

export const rateQuestion = (variables: RateQuestionRequest, fields: string[] = ['id']) => {
  return {
    query: `
      mutation RateQuestion($questionId: ID!, $mark: Int!) {
        rateQuestion(questionId: $questionId, mark: $mark) {
          ${fields.join('\r')}
        }
      }
  `,
    variables
  }
}
