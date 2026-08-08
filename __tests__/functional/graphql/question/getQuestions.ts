import GetQuestions from '../../../../apps/graphql/src/server/schema/question/GetQuestions'

export const getQuestions = (variables: GetQuestions = {}, fields: string[] = ['id']) => {
  return {
    query: `
      query GetQuestions(
        $exam: ID,
        $difficulty: String,
        $type: String,
        $prevCursor: String,
        $cursor: String,
        $nextCursor: String,
        $size: Int,
        $order: String,
        $subscription: String,
        $approved: String,
        $search: String
      ) {
        questions(
          exam: $exam,
          difficulty: $difficulty,
          type: $type,
          prevCursor: $prevCursor,
          cursor: $cursor,
          nextCursor: $nextCursor,
          size: $size,
          order: $order,
          subscription: $subscription,
          approved: $approved,
          search: $search
        ) {
          ${fields.join('\r')}
        }
      }
  `,
    variables
  }
}
