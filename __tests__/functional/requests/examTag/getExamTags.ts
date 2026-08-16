export const getExamTags = (search?: string) => ({
  method: 'GET',
  path: '/exam-tags',
  query: { search },
  field: 'examTags'
})
