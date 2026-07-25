"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getActivities;
const client_1 = require("@apollo/client");
function getActivities(query = {}) {
    return {
        query: (0, client_1.gql) `
        query GetActivities(
            $prevCursor: String,
            $nextCursor: String,
            $cursor: String,
            $size: Int,
            $order: String
        ) {
            activities(
                prevCursor: $prevCursor,
                nextCursor: $nextCursor,
                cursor: $cursor,
                size: $size,
                order: $order
            ) {
                event
                examId
                examName
            }
        }
    `,
        variables: query,
    };
}
//# sourceMappingURL=getActivities.js.map