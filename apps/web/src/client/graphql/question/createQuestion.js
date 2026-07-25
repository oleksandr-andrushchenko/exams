"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createQuestion;
const client_1 = require("@apollo/client");
function createQuestion(createQuestion) {
    return {
        mutation: (0, client_1.gql) `
        mutation CreateQuestion($createQuestion: CreateQuestion!) {
            createQuestion(createQuestion: $createQuestion) {
                id
                title
                isApproved
                isOwner
                isCreator
                rating {averageMark markCount mark}
            }
        }
    `,
        variables: {
            createQuestion,
        },
    };
}
//# sourceMappingURL=createQuestion.js.map