import GetExamSession from '../../../../apps/graphql/src/server/schema/examSession/GetExamSession'

export const createExamSessionCompletion = (variables: GetExamSession, fields: string[] = ['id']) => {
  return {
    query: `
      mutation CreateExamSessionCompletion($examSessionId: ID!) {
        createExamSessionCompletion(examSessionId: $examSessionId) {
          ${fields.join('\r')}
        }
      }
  `,
    variables
  }
}
