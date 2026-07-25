"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getMeAndPermissions;
const client_1 = require("@apollo/client");
function getMeAndPermissions() {
    return {
        query: (0, client_1.gql) `
        query GetMeAndPermissions {
            me {id email permissions}
            permission {hierarchy {regular root}}
        }
    `,
        variables: {},
    };
}
//# sourceMappingURL=getMeAndPermissions.js.map