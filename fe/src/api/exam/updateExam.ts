import { gql } from '@apollo/client'
import UpdateExam from '../../schema/exam/UpdateExam'

export default function updateExam(examId: string, updateExam: UpdateExam): any {
  return {
    mutation: gql`
        mutation UpdateExam($examId: ID!, $updateExam: UpdateExam!) {
            updateExam(examId: $examId, updateExam: $updateExam) {
                id
                name
                questionCount
                approvedQuestionCount
                requiredScore
                isApproved
                isOwner
                isCreator
                rating {
                    averageMark
                    markCount
                    mark
                }
                examSessionId
                tags {id name slug rating examsCount imageFilename}
            }
        }
    `,
    variables: {
      examId,
      updateExam,
    },
  }
}