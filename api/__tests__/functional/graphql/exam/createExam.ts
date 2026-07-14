import CreateExam from '../../../../src/schema/exam/CreateExam'

export const createExam = (variables: { createExam: CreateExam }, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      mutation CreateExam($createExam: CreateExam!) {
        createExam(createExam: $createExam) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}