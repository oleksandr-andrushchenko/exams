import { gql } from '@apollo/client'
import CreateExamSession from '../../../schema/examSession/CreateExamSession'

export default function createExamSession(createExamSession: CreateExamSession): any {
  return {
    mutation: gql`
        mutation CreateExamSession($createExamSession: CreateExamSession!) {
            createExamSession(createExamSession: $createExamSession) {
                id
                ownerId
            }
        }
    `,
    variables: {
      createExamSession,
    },
  }
}