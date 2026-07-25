"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.examQuery = void 0;
exports.default = getExamsForExamsPage;
const client_1 = require("@apollo/client");
exports.examQuery = (0, client_1.gql) `{
    id
    name
    questionCount
    approvedQuestionCount
    requiredScore
    isApproved
    isOwner
    isCreator
    rating {
        markCount
        averageMark
        mark
    }
    examSessionId
    tags {id name slug rating examsCount imageFilename}
}`;
function getExamsForExamsPage(filter = {}) {
    return {
        query: (0, client_1.gql) `
        query GetExamsForExamsPage(
            $size: Int,
            $prevCursor:
            String,
            $nextCursor: String,
            $cursor: String,
            $order: String,
            $subscription: String,
            $approved: String,
            $creator: String,
            $search: String,
            $tag: String,
            $userId: ID
        ) {
            paginatedExams(
                size: $size,
                prevCursor: $prevCursor,
                nextCursor: $nextCursor,
                cursor: $cursor,
                order: $order,
                subscription: $subscription,
                approved: $approved,
                creator: $creator,
                search: $search,
                tag: $tag,
                userId: $userId
            ) {
                data ${exports.examQuery}
                meta {
                    nextCursor
                    prevCursor
                }
            }
        }
    `,
        variables: filter,
    };
}
//# sourceMappingURL=getExamsForExamsPage.js.map