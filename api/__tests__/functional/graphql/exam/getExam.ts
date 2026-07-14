import GetExam from '../../../../src/schema/exam/GetExam'

export const getExam = (variables: GetExam, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      query GetExam($examId: ID!) {
        exam(examId: $examId) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}