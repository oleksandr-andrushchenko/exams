export const deleteMe = () => {
  return {
    query: `
      mutation DeleteMe {
        deleteMe
      }
  `,
  }
}