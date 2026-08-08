import GetCurrentExamSessions from '../../../../apps/graphql/src/server/schema/examSession/GetCurrentExamSessions'

export const getCurrentExamSessions = (variables: GetCurrentExamSessions, fields: string[] = ['id']) => {
  return {
    query: `
      query CurrentExamSessions($examIds: [ID!]!) {
        currentExamSessions(examIds: $examIds) {
          ${fields.join('\r')}
        }
      }
  `,
    variables
  }
}
