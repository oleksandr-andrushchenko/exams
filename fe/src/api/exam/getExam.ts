import { gql } from '@apollo/client'

export default function getExam(examId: string): any {
  return {
    query: gql`
        query GetExam($examId: ID!) {
            exam(examId: $examId) {
                id
                name
                questionCount
                approvedQuestionCount
                requiredScore
                isApproved
                isOwner
                isCreator
                rating {
                    averageMark
                    markCount
                    mark
                }
                examSessionId
            }
        }
    `,
    variables: { examId },
  }
}