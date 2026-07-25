import { gql } from '@apollo/client'
import CreateExamSessionQuestionAnswer from '../../../schema/examSession/CreateExamSessionQuestionAnswer'

export default function createExamSessionQuestionAnswer(
  examSessionId: string,
  question: number,
  createExamSessionQuestionAnswer: CreateExamSessionQuestionAnswer,
): any {
  return {
    mutation: gql`
        mutation CreateAnswerExamSessionQuestion(
            $createExamSessionQuestionAnswer: CreateExamSessionQuestionAnswer!,
            $examSessionId: ID!,
            $question: Int!
        ) {
            createExamSessionQuestionAnswer(
                examSessionId: $examSessionId,
                question: $question,
                createExamSessionQuestionAnswer: $createExamSessionQuestionAnswer
            ) {
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
      createExamSessionQuestionAnswer,
    },
  }
}