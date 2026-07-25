"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = deleteExamSession;
const client_1 = require("@apollo/client");
function deleteExamSession(examSessionId) {
    return {
        mutation: (0, client_1.gql) `
        mutation DeleteExamSession($examSessionId: ID!) {
            deleteExamSession(examSessionId: $examSessionId)
        }
    `,
        variables: {
            examSessionId,
        },
    };
}
//# sourceMappingURL=deleteExamSession.js.map