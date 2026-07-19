import { gql } from '@apollo/client'
import GetExams from '../../schema/exam/GetExams'

export const examQuery = gql`{
    id
    name
    questionCount
    approvedQuestionCount
    requiredScore
    isApproved
    isOwner
    isCreator
    rating {
        markCount
        averageMark
        mark
    }
    examSessionId
    tags {id name slug rating examsCount imageFilename}
}`

export default function getExamsForExamsPage(filter: GetExams = {}): any {
  return {
    query: gql`
        query GetExamsForExamsPage(
            $size: Int,
            $prevCursor:
            String,
            $nextCursor: String,
            $cursor: String,
            $order: String,
            $subscription: String,
            $approved: String,
            $creator: String,
            $search: String,
            $tag: String,
            $userId: ID
        ) {
            paginatedExams(
                size: $size,
                prevCursor: $prevCursor,
                nextCursor: $nextCursor,
                cursor: $cursor,
                order: $order,
                subscription: $subscription,
                approved: $approved,
                creator: $creator,
                search: $search,
                tag: $tag,
                userId: $userId
            ) {
                data ${examQuery}
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