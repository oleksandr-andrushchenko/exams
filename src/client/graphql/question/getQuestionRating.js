"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getQuestionRating;
const client_1 = require("@apollo/client");
function getQuestionRating(questionId) {
    return {
        query: (0, client_1.gql) `
        query GetQuestionRating($questionId: ID!) {
            question(questionId: $questionId) {
                rating {
                    markCount
                    averageMark
                    mark
                }
            }
        }
    `,
        variables: { questionId },
    };
}
//# sourceMappingURL=getQuestionRating.js.map