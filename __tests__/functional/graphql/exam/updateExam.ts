import UpdateExam from '../../../../apps/graphql/src/server/schema/exam/UpdateExam'
import GetExam from '../../../../apps/graphql/src/server/schema/exam/GetExam'

export const updateExam = (
  variables: GetExam & {
    updateExam: UpdateExam
  },
  fields: string[] = ['id']
) => {
  return {
    query: `
      mutation UpdateExam($examId: ID!, $updateExam: UpdateExam!) {
        updateExam(examId: $examId, updateExam: $updateExam) {
          ${fields.join('\r')}
        }
      }
  `,
    variables
  }
}
