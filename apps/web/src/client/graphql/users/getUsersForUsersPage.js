"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getUsersForUsersPage;
const client_1 = require("@apollo/client");
function getUsersForUsersPage(filter = {}) {
    return {
        query: (0, client_1.gql) `
        query GetUsersForUsersPage($prevCursor: String, $nextCursor: String, $cursor: String, $size: Int, $order: String, $search: String) {
            paginatedUsers(prevCursor: $prevCursor, nextCursor: $nextCursor, cursor: $cursor, size: $size, order: $order, search: $search) {
                data {
                    id
                    createdAt
                    updatedAt
                    name
                }
                meta {
                    prevCursor
                    prevUrl
                    nextCursor
                    nextUrl
                    cursor
                    size
                    order
                }
            }
        }
    `,
        variables: filter,
    };
}
//# sourceMappingURL=getUsersForUsersPage.js.map