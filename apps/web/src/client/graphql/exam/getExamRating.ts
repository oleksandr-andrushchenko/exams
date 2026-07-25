import { gql } from '@apollo/client'

export default function getExamRating(examId: string): any {
  return {
    query: gql`
        query GetExamRating($examId: ID!) {
            exam(examId: $examId) {
                rating {
                    markCount
                    averageMark
                    mark
                }
            }
        }
    `,
    variables: { examId },
  }
}