"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createExamSessionQuestionAnswer;
const client_1 = require("@apollo/client");
function createExamSessionQuestionAnswer(examSessionId, question, createExamSessionQuestionAnswer) {
    return {
        mutation: (0, client_1.gql) `
        mutation CreateAnswerExamSessionQuestion(
            $createExamSessionQuestionAnswer: CreateExamSessionQuestionAnswer!,
            $examSessionId: ID!,
            $question: Int!
        ) {
            createExamSessionQuestionAnswer(
                examSessionId: $examSessionId,
                question: $question,
                createExamSessionQuestionAnswer: $createExamSessionQuestionAnswer
            ) {
                examSession {
                    id
                    questionNumber
                    questionCount
                    answeredQuestionCount
                    examId
                    exam {
                        name
                    }
                    ownerId
                }
                question {
                    id
                    title
                    type
                }
                choices
                number
                choice
                answer
            }
        }
    `,
        variables: {
            examSessionId,
            question,
            createExamSessionQuestionAnswer,
        },
    };
}
//# sourceMappingURL=createExamSessionQuestionAnswer.js.map