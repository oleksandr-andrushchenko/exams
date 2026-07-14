export const getMe = (fields: string[] = [ 'id' ]) => {
  return {
    query: `
      query GetMe {
        me {
          ${ fields.join('\r') }
        }
      }
  `,
  }
}