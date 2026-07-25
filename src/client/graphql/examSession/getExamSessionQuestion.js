"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getExamSessionQuestion;
const client_1 = require("@apollo/client");
function getExamSessionQuestion(examSessionId, question) {
    return {
        query: (0, client_1.gql) `
        query GetExamSessionQuestion($examSessionId: ID!, $question: Int!) {
            examSessionQuestion(examSessionId: $examSessionId, question: $question) {
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
//# sourceMappingURL=getExamSessionQuestion.js.map