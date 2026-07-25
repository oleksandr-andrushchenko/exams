"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = deleteExamSessionQuestionAnswer;
const client_1 = require("@apollo/client");
function deleteExamSessionQuestionAnswer(examSessionId, question) {
    return {
        mutation: (0, client_1.gql) `
        mutation DeleteExamSessionQuestionAnswer($examSessionId: ID!, $question: Int!) {
            deleteExamSessionQuestionAnswer(examSessionId: $examSessionId, question: $question) {
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
        },
    };
}
//# sourceMappingURL=deleteExamSessionQuestionAnswer.js.map