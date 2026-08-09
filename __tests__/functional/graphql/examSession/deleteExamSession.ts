import GetExamSession from '../../../../api-lambda/src/server/schema/examSession/GetExamSession'

export const deleteExamSession = (variables: GetExamSession) => {
  return {
    query: `
      mutation DeleteExamSession($examSessionId: ID!) {
        deleteExamSession(examSessionId: $examSessionId)
      }
  `,
    variables
  }
}
