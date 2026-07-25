"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = toggleExamApprove;
const client_1 = require("@apollo/client");
function toggleExamApprove(examId) {
    return {
        mutation: (0, client_1.gql) `
        mutation ToggleExamApprove($examId: ID!) {
            toggleExamApprove(
                examId: $examId
            ) {
                id
                name
                questionCount
                approvedQuestionCount
                requiredScore
                isApproved
                isOwner
                isCreator
                rating {averageMark markCount mark}
                examSessionId
            }
        }
    `,
        variables: {
            examId,
        },
    };
}
//# sourceMappingURL=toggleExamApprove.js.map