"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = deleteQuestion;
const client_1 = require("@apollo/client");
function deleteQuestion(questionId) {
    return {
        mutation: (0, client_1.gql) `
        mutation DeleteQuestion($questionId: ID!) {
            deleteQuestion(
                questionId: $questionId
            )
        }
    `,
        variables: {
            questionId,
        },
    };
}
//# sourceMappingURL=deleteQuestion.js.map