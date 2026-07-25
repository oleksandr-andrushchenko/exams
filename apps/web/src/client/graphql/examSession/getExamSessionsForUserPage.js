"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getExamSessionsForUserPage;
const client_1 = require("@apollo/client");
function getExamSessionsForUserPage(userId, filter = {}) {
    return {
        query: (0, client_1.gql) `
      query GetExamSessionsForUserPage($userId: ID, $size: Int, $cursor: String, $nextCursor: String, $prevCursor: String, $order: String) {
        paginatedExamSessions(userId: $userId, size: $size, cursor: $cursor, nextCursor: $nextCursor, prevCursor: $prevCursor, order: $order) {
          data {
            id
            examId
            exam { id name }
            questionNumber
            questionCount
            answeredQuestionCount
            correctAnswerCount
            completedAt
            createdAt
          }
          meta { nextCursor prevCursor }
        }
      }
    `,
        variables: { ...filter, userId },
    };
}
//# sourceMappingURL=getExamSessionsForUserPage.js.map