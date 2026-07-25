import { gql } from '@apollo/client'
import GetQuestions from '../../../schema/question/GetQuestions'

export default function getQuestionsForExamPage(examId: string, filter: GetQuestions = {}): any {
  filter.exam = examId

  return {
    query: gql`
        query GetQuestionsForExamPage(
            $prevCursor: String,
            $nextCursor: String,
            $cursor: String,
            $size: Int,
            $order: String,
            $subscription: String,
            $approved: String,
            $creator: String,
            $exam: ID,
            $search: String,
            $difficulty: String,
            $type: String
        ) {
            paginatedQuestions(
                prevCursor: $prevCursor,
                nextCursor: $nextCursor,
                cursor: $cursor,
                size: $size,
                order: $order,
                subscription: $subscription,
                approved: $approved,
                creator: $creator,
                exam: $exam,
                search: $search,
                difficulty: $difficulty,
                type: $type
            ) {
                data {
                    difficulty
                    id
                    title
                    type
                    examId
                    choices {
                        title
                        correct
                        explanation
                    }
                    isApproved
                    isOwner
                    isCreator
                    rating {averageMark markCount mark}
                }
                meta {
                    nextCursor
                    prevCursor
                }
            }
        }
    `,
    variables: filter,
  }
}