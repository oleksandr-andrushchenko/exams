"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = rateExam;
const client_1 = require("@apollo/client");
function rateExam(examId, mark) {
    return {
        mutation: (0, client_1.gql) `
        mutation RateExam($examId: ID!, $mark: Int!) {
            rateExam(examId: $examId, mark: $mark) {
                id
            }
        }
    `,
        variables: {
            examId,
            mark,
        },
    };
}
//# sourceMappingURL=rateExam.js.map