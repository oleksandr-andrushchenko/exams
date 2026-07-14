import GetExams from '../../../../src/schema/exam/GetExams'

export const getExams = (variables: GetExams = {}, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      query GetExams($categoryId: ID, $completion: Boolean, $prevCursor: String, $cursor: String, $nextCursor: String, $size: Int, $order: String) {
        exams(categoryId: $categoryId, completion: $completion, prevCursor: $prevCursor, cursor: $cursor, nextCursor: $nextCursor, size: $size, order: $order) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}