import { gql } from '@apollo/client'

export default function deleteExamSession(examSessionId: string): any {
  return {
    mutation: gql`
        mutation DeleteExamSession($examSessionId: ID!) {
            deleteExamSession(examSessionId: $examSessionId)
        }
    `,
    variables: {
      examSessionId,
    },
  }
}