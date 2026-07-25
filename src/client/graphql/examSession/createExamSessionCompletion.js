"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createExamSessionCompletion;
const client_1 = require("@apollo/client");
function createExamSessionCompletion(examSessionId) {
    return {
        mutation: (0, client_1.gql) `
        mutation CreateExamSessionCompletion($examSessionId: ID!) {
            createExamSessionCompletion(examSessionId: $examSessionId) {
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
        }
    `,
        variables: {
            examSessionId,
        },
    };
}
//# sourceMappingURL=createExamSessionCompletion.js.map