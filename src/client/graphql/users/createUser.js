"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createUser;
const client_1 = require("@apollo/client");
function createUser(createUser) {
    return {
        mutation: (0, client_1.gql) `
        mutation CreateUser($createUser: CreateUser!) {
            createUser(createUser: $createUser) {
                id
                createdAt
                name
                email
                permissions
            }
        }
    `,
        variables: {
            createUser,
        },
    };
}
//# sourceMappingURL=createUser.js.map