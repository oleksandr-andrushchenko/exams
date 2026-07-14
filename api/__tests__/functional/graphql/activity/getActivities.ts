import ActivityQuery from '../../../../src/schema/activity/ActivityQuery'

export const getActivities = (variables: ActivityQuery = {}, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      query GetActivities(
        $prevCursor: String,
        $nextCursor: String,
        $cursor: String,
        $size: Int,
        $order: String
      ) {
        activities(
          prevCursor: $prevCursor,
          nextCursor: $nextCursor,
          cursor: $cursor,
          size: $size,
          order: $order
        ) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}