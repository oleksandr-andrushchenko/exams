import { gql } from '@apollo/client'

export default function getCurrentExamSessionQuestion(examSessionId: string): any {
  return {
    query: gql`
        query GetCurrentExamSessionQuestion($examSessionId: ID!) {
            currentExamSessionQuestion(examSessionId: $examSessionId) {
                examSession {
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
                question {
                    id
                    title
                    type
                }
                choices
                number
                choice
                answer
            }
        }
    `,
    variables: {
      examSessionId,
    },
  }
}