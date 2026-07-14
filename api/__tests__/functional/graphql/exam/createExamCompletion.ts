import GetExam from '../../../../src/schema/exam/GetExam'

export const createExamCompletion = (variables: GetExam, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      mutation CreateExamCompletion($examId: ID!) {
        createExamCompletion(examId: $examId) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}