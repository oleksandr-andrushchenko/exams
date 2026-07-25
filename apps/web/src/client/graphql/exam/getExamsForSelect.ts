import { gql } from '@apollo/client'

export default function getExamsForSelect(): any {
  return {
    query: gql`
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
  }
}