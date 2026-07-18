import { gql } from '@apollo/client'

export default function getOneNonCompletedExamExamSessions(examId: string): any {
  return {
    query: gql`
        query GetOneNonCompletedExamExamSessions($examId: ID, $size: Int, $completion: Boolean) {
            examSessions(examId: $examId, size: $size, completion: $completion) {
                id
                examId
                ownerId
            }
        }
    `,
    variables: {
      examId,
      completion: false,
      size: 1,
    },
  }
}