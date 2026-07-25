"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = deleteExam;
const client_1 = require("@apollo/client");
function deleteExam(examId) {
    return {
        mutation: (0, client_1.gql) `
        mutation DeleteExam($examId: ID!) {
            deleteExam(examId: $examId)
        }
    `,
        variables: {
            examId,
        },
    };
}
//# sourceMappingURL=deleteExam.js.map