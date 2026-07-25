"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getQuestion;
const client_1 = require("@apollo/client");
function getQuestion(questionId) {
    return {
        query: (0, client_1.gql) `
        query GetQuestion($questionId: ID!) {
            question(questionId: $questionId) {
                id
                examId
                title
                exam {
                    name
                }
                type
                choices {
                    title
                    correct
                    explanation
                }
                difficulty
                isApproved
                isOwner
                isCreator
                rating {averageMark markCount mark}
            }
        }
    `,
        variables: {
            questionId,
        },
    };
}
//# sourceMappingURL=getQuestion.js.map