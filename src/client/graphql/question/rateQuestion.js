"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = rateQuestion;
const client_1 = require("@apollo/client");
function rateQuestion(questionId, mark) {
    return {
        mutation: (0, client_1.gql) `
        mutation RateQuestion($questionId: ID!, $mark: Int!) {
            rateQuestion(questionId: $questionId, mark: $mark) {
                id
            }
        }
    `,
        variables: {
            questionId,
            mark,
        },
    };
}
//# sourceMappingURL=rateQuestion.js.map