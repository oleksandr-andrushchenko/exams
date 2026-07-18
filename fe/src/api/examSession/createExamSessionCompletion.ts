import { gql } from '@apollo/client'

export default function createExamSessionCompletion(examSessionId: string): any {
  return {
    mutation: gql`
        mutation CreateExamSessionCompletion($examSessionId: ID!) {
            createExamSessionCompletion(examSessionId: $examSessionId) {
                id
                questionNumber
                questionCount
                answeredQuestionCount
                correctAnswerCount
                examId
                exam {
                    name
                    requiredScore
                }
                completedAt
                ownerId
            }
        }
    `,
    variables: {
      examSessionId,
    },
  }
}