import GetExamSession from '../../../../apps/graphql/src/server/schema/examSession/GetExamSession'

export const getExamSession = (variables: GetExamSession, fields: string[] = ['id']) => {
  return {
    query: `
      query GetExamSession($examSessionId: ID!) {
        examSession(examSessionId: $examSessionId) {
          ${fields.join('\r')}
        }
      }
  `,
    variables
  }
}
