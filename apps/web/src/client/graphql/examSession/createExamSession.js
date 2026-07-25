"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createExamSession;
const client_1 = require("@apollo/client");
function createExamSession(createExamSession) {
    return {
        mutation: (0, client_1.gql) `
        mutation CreateExamSession($createExamSession: CreateExamSession!) {
            createExamSession(createExamSession: $createExamSession) {
                id
                ownerId
            }
        }
    `,
        variables: {
            createExamSession,
        },
    };
}
//# sourceMappingURL=createExamSession.js.map