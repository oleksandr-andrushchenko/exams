"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = updateQuestion;
const client_1 = require("@apollo/client");
function updateQuestion(questionId, updateQuestion) {
    return {
        mutation: (0, client_1.gql) `
        mutation UpdateQuestion($questionId: ID!, $updateQuestion: UpdateQuestion!) {
            updateQuestion(questionId: $questionId, updateQuestion: $updateQuestion) {
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
                rating {
                    averageMark
                    markCount
                    mark
                }
            }
        }
    `,
        variables: {
            questionId,
            updateQuestion,
        },
    };
}
//# sourceMappingURL=updateQuestion.js.map