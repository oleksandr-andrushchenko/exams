import { gql } from '@apollo/client'

export default function getExamForExamPage(examId: string): any {
  return {
    query: gql`
        query GetExamForExamPage($examId: ID!) {
            exam(examId: $examId) {
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
    variables: { examId },
  }
}