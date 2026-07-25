"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getUserForUserPage;
const client_1 = require("@apollo/client");
function getUserForUserPage(userId) {
    return {
        query: (0, client_1.gql) `
      query GetUserForUserPage($userId: ID!) {
        user(userId: $userId) {
          id
          name
          createdAt
          updatedAt
        }
      }
    `,
        variables: { userId },
    };
}
//# sourceMappingURL=getUserForUserPage.js.map