"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getHomeData;
const client_1 = require("@apollo/client");
function getHomeData(size = 8) {
    return {
        query: (0, client_1.gql) `
      query GetHomeData($size: Int) {
        examTags(size: $size) { id name slug rating examsCount imageFilename }
        paginatedExams(size: $size, order: "desc") {
          data { id name questionCount approvedQuestionCount requiredScore rating { averageMark markCount mark } tags { id name slug rating examsCount imageFilename } }
        }
        paginatedQuestions(size: $size, order: "desc") {
          data { id title difficulty exam { id name } rating { averageMark markCount mark } }
        }
        paginatedUsers(size: $size, order: "desc") {
          data { id name createdAt updatedAt }
        }
      }
    `,
        variables: { size },
    };
}
//# sourceMappingURL=getHomeData.js.map