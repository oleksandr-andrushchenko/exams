import { gql } from '@apollo/client'

export default function getExamTags(search: string = ''): any {
  return {
    query: gql`
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
  }
}
