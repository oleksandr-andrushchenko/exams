import { gql } from '@apollo/client'
import GetExamSessions from '../../../schema/examSession/GetExamSessions'

export default function getExamSessionsForUserPage(userId: string, filter: GetExamSessions = {}): any {
  return {
    query: gql`
      query GetExamSessionsForUserPage($userId: ID, $size: Int, $cursor: String, $nextCursor: String, $prevCursor: String, $order: String) {
        paginatedExamSessions(userId: $userId, size: $size, cursor: $cursor, nextCursor: $nextCursor, prevCursor: $prevCursor, order: $order) {
          data {
            id
            examId
            exam { id name }
            questionNumber
            questionCount
            answeredQuestionCount
            correctAnswerCount
            completedAt
            createdAt
          }
          meta { nextCursor prevCursor }
        }
      }
    `,
    variables: { ...filter, userId },
  }
}
