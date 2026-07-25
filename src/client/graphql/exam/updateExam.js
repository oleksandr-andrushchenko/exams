"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = updateExam;
const client_1 = require("@apollo/client");
function updateExam(examId, updateExam) {
    return {
        mutation: (0, client_1.gql) `
        mutation UpdateExam($examId: ID!, $updateExam: UpdateExam!) {
            updateExam(examId: $examId, updateExam: $updateExam) {
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
        variables: {
            examId,
            updateExam,
        },
    };
}
//# sourceMappingURL=updateExam.js.map