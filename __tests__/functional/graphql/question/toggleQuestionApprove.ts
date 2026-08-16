import GetQuestion from '../../../../api-lambda/src/schema/question/GetQuestion'
import Question from '../../../../api-lambda/src/entities/question/Question'

export const toggleQuestionApprove = (variables: GetQuestion, fields: (keyof Question)[] = ['id']) => {
  return {
    query: `
      mutation ToggleQuestionApprove($questionId: ID!) {
        toggleQuestionApprove(questionId: $questionId) {
          ${fields.join('\r')}
        }
      }
  `,
    variables
  }
}
