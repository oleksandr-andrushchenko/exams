"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getExamTags;
const client_1 = require("@apollo/client");
function getExamTags(search = '') {
    return {
        query: (0, client_1.gql) `
      query GetExamTags($search: String) {
        examTags(search: $search) {
          id
          name
          slug
          rating
          examsCount
          imageFilename
        }
      }
    `,
        variables: { search },
    };
}
//# sourceMappingURL=getExamTags.js.map