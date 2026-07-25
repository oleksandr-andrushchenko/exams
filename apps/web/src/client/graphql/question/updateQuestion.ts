import { gql } from '@apollo/client'
import UpdateQuestion from '../../../schema/question/UpdateQuestion'

export default function updateQuestion(questionId: string, updateQuestion: UpdateQuestion): any {
  return {
    mutation: gql`
        mutation UpdateQuestion($questionId: ID!, $updateQuestion: UpdateQuestion!) {
            updateQuestion(questionId: $questionId, updateQuestion: $updateQuestion) {
                id
                examId
                title
                exam {
                    name
                }
                type
                choices {
                    title
                    correct
                    explanation
                }
                difficulty
                isApproved
                isOwner
                isCreator
                rating {
                    averageMark
                    markCount
                    mark
                }
            }
        }
    `,
    variables: {
      questionId,
      updateQuestion,
    },
  }
}