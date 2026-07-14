import CreateQuestion from '../../../../src/schema/question/CreateQuestion'

export const createQuestion = (variables: { createQuestion: CreateQuestion }, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      mutation CreateQuestion($createQuestion: CreateQuestion!) {
        createQuestion(createQuestion: $createQuestion) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}