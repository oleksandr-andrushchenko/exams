import CreateExamQuestionAnswer from '../../../../src/schema/exam/CreateExamQuestionAnswer'
import GetExamQuestion from '../../../../src/schema/exam/GetExamQuestion'

export const createExamQuestionAnswer = (variables: GetExamQuestion & {
  createExamQuestionAnswer: CreateExamQuestionAnswer
}, fields: string[] = [ 'number' ]) => {
  return {
    query: `
      mutation CreateExamQuestionAnswer($examId: ID!, $question: Int!, $createExamQuestionAnswer: CreateExamQuestionAnswer!) {
        createExamQuestionAnswer(examId: $examId, question: $question, createExamQuestionAnswer: $createExamQuestionAnswer) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}