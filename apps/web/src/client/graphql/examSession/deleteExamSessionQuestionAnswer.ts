import { gql } from '@apollo/client'

export default function deleteExamSessionQuestionAnswer(examSessionId: string, question: number): any {
  return {
    mutation: gql`
        mutation DeleteExamSessionQuestionAnswer($examSessionId: ID!, $question: Int!) {
            deleteExamSessionQuestionAnswer(examSessionId: $examSessionId, question: $question) {
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