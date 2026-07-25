"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getOneNonCompletedExamExamSessions;
const client_1 = require("@apollo/client");
function getOneNonCompletedExamExamSessions(examId) {
    return {
        query: (0, client_1.gql) `
        query GetOneNonCompletedExamExamSessions($examId: ID, $size: Int, $completion: Boolean) {
            examSessions(examId: $examId, size: $size, completion: $completion) {
                id
                examId
                ownerId
            }
        }
    `,
        variables: {
            examId,
            completion: false,
            size: 1,
        },
    };
}
//# sourceMappingURL=getOneNonCompletedExamExamSessions.js.map