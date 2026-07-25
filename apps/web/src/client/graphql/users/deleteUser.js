"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = deleteUser;
const client_1 = require("@apollo/client");
function deleteUser(userId) {
    return {
        mutation: (0, client_1.gql) `
        mutation DeleteUser($userId: ID!) {
            deleteUser(userId: $userId)
        }
    `,
        variables: {
            userId,
        },
    };
}
//# sourceMappingURL=deleteUser.js.map