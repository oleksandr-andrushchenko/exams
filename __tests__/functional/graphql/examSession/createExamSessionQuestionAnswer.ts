import CreateExamSessionQuestionAnswer from '../../../../src/server/schema/examSession/CreateExamSessionQuestionAnswer'
import GetExamSessionQuestion from '../../../../src/server/schema/examSession/GetExamSessionQuestion'

export const createExamSessionQuestionAnswer = (variables: GetExamSessionQuestion & {
  createExamSessionQuestionAnswer: CreateExamSessionQuestionAnswer
}, fields: string[] = [ 'number' ]) => {
  return {
    query: `
      mutation CreateExamSessionQuestionAnswer($examSessionId: ID!, $question: Int!, $createExamSessionQuestionAnswer: CreateExamSessionQuestionAnswer!) {
        createExamSessionQuestionAnswer(examSessionId: $examSessionId, question: $question, createExamSessionQuestionAnswer: $createExamSessionQuestionAnswer) {
          ${ fields.join('\r') }
        }
      }
  `,
    variables,
  }
}