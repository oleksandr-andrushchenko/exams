"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getExam;
const client_1 = require("@apollo/client");
function getExam(examId) {
    return {
        query: (0, client_1.gql) `
        query GetExam($examId: ID!) {
            exam(examId: $examId) {
                id
                name
                questionCount
                approvedQuestionCount
                requiredScore
                isApproved
                isOwner
                isCreator
                rating {
                    averageMark
                    markCount
                    mark
                }
                examSessionId
            }
        }
    `,
        variables: { examId },
    };
}
//# sourceMappingURL=getExam.js.map