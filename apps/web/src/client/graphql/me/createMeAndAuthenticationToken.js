"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createMeAndAuthenticationToken;
const client_1 = require("@apollo/client");
function createMeAndAuthenticationToken(createMe) {
    return {
        mutation: (0, client_1.gql) `
        mutation Register($createMe: CreateMe!, $credentials: Credentials!) {
            createMe(createMe: $createMe) {id}
            createAuthenticationToken(credentials: $credentials) {token}
        }
    `,
        variables: {
            createMe,
            credentials: createMe,
        },
    };
}
//# sourceMappingURL=createMeAndAuthenticationToken.js.map