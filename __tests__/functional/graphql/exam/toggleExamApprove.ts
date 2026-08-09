import GetExam from '../../../../api-lambda/src/server/schema/exam/GetExam'
import Exam from '../../../../api-lambda/src/server/entities/exam/Exam'

export const toggleExamApprove = (variables: GetExam, fields: (keyof Exam)[] = ['id']) => {
  return {
    query: `
      mutation ToggleExamApprove($examId: ID!) {
        toggleExamApprove(examId: $examId) {
          ${fields.join('\r')}
        }
      }
  `,
    variables
  }
}
