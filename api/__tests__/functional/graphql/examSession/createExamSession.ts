import CreateExamSession from '../../../../src/schema/examSession/CreateExamSession'

export const createExamSession = (variables: { createExamSession: CreateExamSession }, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      mutation CreateExamSession($createExamSession: CreateExamSession!) {
        createExamSession(createExamSession: $createExamSession) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}