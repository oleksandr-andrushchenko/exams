import GetQuestion from '../../../../src/server/schema/question/GetQuestion'

export const deleteQuestion = (variables: GetQuestion) => {
  return {
    query: `
      mutation DeleteQuestion($questionId: ID!) {
        deleteQuestion(questionId: $questionId)
      }
  `,
    variables,
  }
}