"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getQuestionsForQuestionsPage;
const client_1 = require("@apollo/client");
function getQuestionsForQuestionsPage(filter = {}) {
    return {
        query: (0, client_1.gql) `
        query GetQuestionsForQuestionsPage(
            $prevCursor: String,
            $nextCursor: String,
            $cursor: String,
            $size: Int,
            $order: String,
            $subscription: String,
            $approved: String,
            $creator: String,
            $exam: ID,
            $search: String,
            $difficulty: String,
            $type: String
        ) {
            paginatedQuestions(
                prevCursor: $prevCursor,
                nextCursor: $nextCursor,
                cursor: $cursor,
                size: $size,
                order: $order,
                subscription: $subscription,
                approved: $approved,
                creator: $creator,
                exam: $exam,
                search: $search,
                difficulty: $difficulty,
                type: $type
            ) {
                data {
                    id
                    examId
                    title
                    type
                    choices {
                        title
                        correct
                        explanation
                    }
                    difficulty
                    isApproved
                    isOwner
                    isCreator
                    rating {averageMark markCount mark}
                }
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
//# sourceMappingURL=getQuestionsForQuestionsPage.js.map