import RateExamRequest from '../../../../src/schema/exam/RateExamRequest'

export const rateExam = (variables: RateExamRequest, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      mutation RateExam($examId: ID!, $mark: Int!) {
        rateExam(examId: $examId, mark: $mark) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}