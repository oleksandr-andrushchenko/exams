export const deleteUser = (variables: any) => ({
  method: 'DELETE',
  path: '/users/' + variables.userId,
  field: 'deleteUser'
})
