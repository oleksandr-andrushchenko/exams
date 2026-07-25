"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = getExamsForSelect;
const client_1 = require("@apollo/client");
function getExamsForSelect() {
    return {
        query: (0, client_1.gql) `
        query GetExamsForSelect($size: Int) {
            exams(size: $size) {
                id
                name
            }
        }
    `,
        variables: {
            size: 50,
        },
    };
}
//# sourceMappingURL=getExamsForSelect.js.map