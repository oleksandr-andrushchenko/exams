import { gql } from '@apollo/client'

export default function toggleQuestionApprove(questionId: string): any {
  return {
    mutation: gql`
        mutation ToggleQuestionApprove($questionId: ID!) {
            toggleQuestionApprove(
                questionId: $questionId
            ) {
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
                rating {averageMark markCount mark}
            }
        }
    `,
    variables: {
      questionId,
    },
  }
}