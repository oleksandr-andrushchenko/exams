import GetExam from '../../../../api-lambda/src/schema/exam/GetExam'
import Exam from '../../../../api-lambda/src/entities/exam/Exam'

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
