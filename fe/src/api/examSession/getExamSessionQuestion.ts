import { gql } from '@apollo/client'

export default function getExamSessionQuestion(examSessionId: string, question: number): any {
  return {
    query: gql`
        query GetExamSessionQuestion($examSessionId: ID!, $question: Int!) {
            examSessionQuestion(examSessionId: $examSessionId, question: $question) {
                examSession {
                    id
                    questionNumber
                    questionCount
                    answeredQuestionCount
                    examId
                    exam {
                        name
                    }
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
      question,
    },
  }
}