import GetExamQuestion from '../../../../src/schema/exam/GetExamQuestion'

export const getExamQuestion = (
  variables: GetExamQuestion,
  fields: string[] = [ 'number' ],
) => {
  return {
    query: `
      query GetExamQuestion($examId: ID!, $question: Int!) {
        examQuestion(examId: $examId, question: $question) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}