import GetQuestions from '../../../../src/schema/question/GetQuestions'

export const getQuestions = (variables: GetQuestions = {}, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      query GetQuestions(
        $category: ID,
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
          category: $category,
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
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}