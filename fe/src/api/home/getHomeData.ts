import { gql } from '@apollo/client'

export default function getHomeData(size: number = 8): any {
  return {
    query: gql`
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
  }
}
