import GetQuestion from '../../../../src/schema/question/GetQuestion'

export const getQuestion = (variables: GetQuestion, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      query GetQuestion($questionId: ID!) {
        question(questionId: $questionId) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}