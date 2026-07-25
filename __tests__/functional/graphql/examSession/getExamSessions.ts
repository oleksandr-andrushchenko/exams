import GetExamSessions from '../../../../src/server/schema/examSession/GetExamSessions'

export const getExamSessions = (variables: GetExamSessions = {}, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      query GetExamSessions($examId: ID, $completion: Boolean, $prevCursor: String, $cursor: String, $nextCursor: String, $size: Int, $order: String) {
        examSessions(examId: $examId, completion: $completion, prevCursor: $prevCursor, cursor: $cursor, nextCursor: $nextCursor, size: $size, order: $order) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}