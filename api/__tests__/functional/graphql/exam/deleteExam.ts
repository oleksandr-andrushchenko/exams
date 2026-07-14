import GetExam from '../../../../src/schema/exam/GetExam'

export const deleteExam = (variables: GetExam) => {
  return {
    query: `
      mutation DeleteExam($examId: ID!) {
        deleteExam(examId: $examId)
      }
  `,
    variables,
  }
}