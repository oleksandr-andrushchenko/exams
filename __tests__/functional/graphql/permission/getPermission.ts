export const getPermission = (fields: string[] = [ 'items', 'hierarchy {regular root}' ]) => {
  return {
    query: `
      query GetPermission {
        permission {
          ${ fields.join('\r') }
        }
      }
  `,
  }
}