"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getExamForExamPage;
const client_1 = require("@apollo/client");
function getExamForExamPage(examId) {
    return {
        query: (0, client_1.gql) `
        query GetExamForExamPage($examId: ID!) {
            exam(examId: $examId) {
                id
                name
                questionCount
                approvedQuestionCount
                requiredScore
                isApproved
                isOwner
                isCreator
                rating {
                    averageMark
                    markCount
                    mark
                }
                examSessionId
                tags {id name slug rating examsCount imageFilename}
            }
        }
    `,
        variables: { examId },
    };
}
//# sourceMappingURL=getExamForExamPage.js.map