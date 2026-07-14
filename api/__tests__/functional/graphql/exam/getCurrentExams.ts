import GetCurrentExams from '../../../../src/schema/exam/GetCurrentExams'

export const getCurrentExams = (variables: GetCurrentExams, fields: string[] = [ 'id' ]) => {
  return {
    query: `
      query CurrentExams($categoryIds: [ID!]!) {
        currentExams(categoryIds: $categoryIds) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}