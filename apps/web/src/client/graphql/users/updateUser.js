"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = updateUser;
const client_1 = require("@apollo/client");
function updateUser(userId, updateUser) {
    return {
        mutation: (0, client_1.gql) `
        mutation UpdateUser($userId: ID!, $updateUser: UpdateUser!) {
            updateUser(userId: $userId, updateUser: $updateUser) {
                id
                createdAt
                name
                email
                permissions
            }
        }
    `,
        variables: {
            userId,
            updateUser,
        },
    };
}
//# sourceMappingURL=updateUser.js.map