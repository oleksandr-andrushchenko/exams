import GetExamSessionQuestion from '../../../../api-lambda/src/schema/examSession/GetExamSessionQuestion'

export const getExamSessionQuestion = (variables: GetExamSessionQuestion, fields: string[] = ['number']) => {
  return {
    query: `
      query GetExamSessionQuestion($examSessionId: ID!, $question: Int!) {
        examSessionQuestion(examSessionId: $examSessionId, question: $question) {
          ${fields.join('\r')}
        }
      }
  `,
    variables
  }
}
