import GetQuestion from '../../../../src/server/schema/question/GetQuestion'
import Question from '../../../../src/server/entities/question/Question'

export const toggleQuestionApprove = (variables: GetQuestion, fields: (keyof Question)[] = [ 'id' ]) => {
  return {
    query: `
      mutation ToggleQuestionApprove($questionId: ID!) {
        toggleQuestionApprove(questionId: $questionId) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}