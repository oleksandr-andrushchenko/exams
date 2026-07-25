import Permission from '../../enum/Permission'

export default interface UpdateUser {
  name?: string
  email?: string
  password?: string
  permission?: Permission[]
}