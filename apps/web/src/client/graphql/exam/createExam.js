"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createExam;
const client_1 = require("@apollo/client");
function createExam(createExam) {
    return {
        mutation: (0, client_1.gql) `
        mutation CreateExam($createExam: CreateExam!) {
            createExam(createExam: $createExam) {
                id
                name
                isApproved
                isOwner
                isCreator
                rating {averageMark markCount mark}
                tags {id name slug rating examsCount imageFilename}
            }
        }
    `,
        variables: {
            createExam,
        },
    };
}
//# sourceMappingURL=createExam.js.map