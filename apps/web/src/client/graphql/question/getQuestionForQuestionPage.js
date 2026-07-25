"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getQuestionForQuestionPage;
const client_1 = require("@apollo/client");
function getQuestionForQuestionPage(questionId) {
    return {
        query: (0, client_1.gql) `
        query GetQuestionForQuestionPage($questionId: ID!) {
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
        },
    };
}
//# sourceMappingURL=getQuestionForQuestionPage.js.map