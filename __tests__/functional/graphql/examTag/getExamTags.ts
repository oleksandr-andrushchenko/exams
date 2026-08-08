export const getExamTags = (search?: string) => ({
  query: `query GetExamTags($search: String) { examTags(search: $search) { id name slug rating examsCount imageFilename } }`,
  variables: { search }
})
