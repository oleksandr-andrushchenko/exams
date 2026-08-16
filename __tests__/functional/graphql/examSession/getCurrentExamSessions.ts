import GetCurrentExamSessions from '../../../../api-lambda/src/schema/examSession/GetCurrentExamSessions'

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
