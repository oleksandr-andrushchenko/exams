import { gql } from '@apollo/client'

export default function toggleExamApprove(examId: string): any {
  return {
    mutation: gql`
        mutation ToggleExamApprove($examId: ID!) {
            toggleExamApprove(
                examId: $examId
            ) {
                id
                name
                questionCount
                approvedQuestionCount
                requiredScore
                isApproved
                isOwner
                isCreator
                rating {averageMark markCount mark}
                examSessionId
            }
        }
    `,
    variables: {
      examId,
    },
  }
}