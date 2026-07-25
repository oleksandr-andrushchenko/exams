"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createAuthenticationToken;
const client_1 = require("@apollo/client");
function createAuthenticationToken(credentials) {
    return {
        mutation: (0, client_1.gql) `
        mutation CreateAuthenticationToken($credentials: Credentials!) {
            createAuthenticationToken(credentials: $credentials) {token}
        }
    `,
        variables: {
            credentials,
        },
    };
}
//# sourceMappingURL=createAuthenticationToken.js.map