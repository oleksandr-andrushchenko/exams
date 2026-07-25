"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getCurrentExamSessionQuestion;
const client_1 = require("@apollo/client");
function getCurrentExamSessionQuestion(examSessionId) {
    return {
        query: (0, client_1.gql) `
        query GetCurrentExamSessionQuestion($examSessionId: ID!) {
            currentExamSessionQuestion(examSessionId: $examSessionId) {
                examSession {
                    id
                    questionNumber
                    questionCount
                    answeredQuestionCount
                    correctAnswerCount
                    examId
                    exam {
                        name
                        requiredScore
                    }
                    completedAt
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
        },
    };
}
//# sourceMappingURL=getCurrentExamSessionQuestion.js.map