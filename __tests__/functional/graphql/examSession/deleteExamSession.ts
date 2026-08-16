import GetExamSession from '../../../../api-lambda/src/schema/examSession/GetExamSession'

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
