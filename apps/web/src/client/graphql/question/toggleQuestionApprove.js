"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = toggleQuestionApprove;
const client_1 = require("@apollo/client");
function toggleQuestionApprove(questionId) {
    return {
        mutation: (0, client_1.gql) `
        mutation ToggleQuestionApprove($questionId: ID!) {
            toggleQuestionApprove(
                questionId: $questionId
            ) {
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
//# sourceMappingURL=toggleQuestionApprove.js.map