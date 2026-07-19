import GetExams from '../../../../src/schema/exam/GetExams'

export const getExams = (variables: GetExams = {}, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      query GetExams(
        $prevCursor: String,
        $cursor: String,
        $nextCursor: String,
        $size: Int,
        $order: String,
        $subscription: String,
        $approved: String,
        $search: String,
        $tag: String
      ) {
        exams(
          prevCursor: $prevCursor,
          cursor: $cursor,
          nextCursor: $nextCursor,
          size: $size,
          order: $order,
          subscription: $subscription,
          approved: $approved,
          search: $search,
          tag: $tag
        ) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}