import { gql } from '@apollo/client'

export default function rateExam(examId: string, mark: number): any {
  return {
    mutation: gql`
        mutation RateExam($examId: ID!, $mark: Int!) {
            rateExam(examId: $examId, mark: $mark) {
                id
            }
        }
    `,
    variables: {
      examId,
      mark,
    },
  }
}