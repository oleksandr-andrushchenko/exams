"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getExamRating;
const client_1 = require("@apollo/client");
function getExamRating(examId) {
    return {
        query: (0, client_1.gql) `
        query GetExamRating($examId: ID!) {
            exam(examId: $examId) {
                rating {
                    markCount
                    averageMark
                    mark
                }
            }
        }
    `,
        variables: { examId },
    };
}
//# sourceMappingURL=getExamRating.js.map