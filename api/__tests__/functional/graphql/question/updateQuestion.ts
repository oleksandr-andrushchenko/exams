import GetQuestion from '../../../../src/schema/question/GetQuestion'
import UpdateQuestion from '../../../../src/schema/question/UpdateQuestion'

export const updateQuestion = (variables: GetQuestion & {
  updateQuestion: UpdateQuestion
}, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      mutation UpdateQuestion($questionId: ID!, $updateQuestion: UpdateQuestion!) {
        updateQuestion(questionId: $questionId, updateQuestion: $updateQuestion) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}