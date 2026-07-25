import { Breadcrumbs } from '@material-tailwind/react'
import Route from '../enum/Route'
import useAuth from '../hooks/useAuth'
import { HomeIcon } from '@heroicons/react/24/solid'
import { memo, useEffect, useState } from 'react'
import Paginated from '../schema/pagination/Paginated'
import User from '../schema/users/User'
import getUsersForUsersPage from '../client/graphql/users/getUsersForUsersPage'
import UserPermission from '../enum/users/UserPermission'
import AddUser from '../components/users/AddUser'
import { ListIcon } from '../registry/icons'
import H1 from '../components/typography/H1'
import DeleteUser from '../components/users/DeleteUser'
import Table from '../components/elements/Table'
import Link from '../components/elements/Link'

const Users = () => {
  const [ tableKey, setTableKey ] = useState<number>(2)
  const refresh = () => setTableKey(Math.random())
  const { checkAuthorization } = useAuth()

  useEffect(() => {
    document.title = 'Users'
  }, [])

  return <>
    <Breadcrumbs>
      <Link icon={ HomeIcon } label="Home" to={ Route.Home }/>
      <Link label="Users" to={ Route.Users }/>
    </Breadcrumbs>

    <H1 icon={ ListIcon } label="Users" sub="Users info"/>

    <Table
      key2={ tableKey }
      buttons={ {
        create: checkAuthorization(UserPermission.Create) && <AddUser onSubmit={ refresh }/>,
      } }
      columns={ [ '#', 'Name', '' ] }
      queryOptions={ (filter) => getUsersForUsersPage(filter) }
      queryData={ (data: { paginatedUsers: Paginated<User> }) => data.paginatedUsers }
      mapper={ (user: User, index: number) => [
        user.id,
        index + 1,
        <Link label={ user.name || 'Unnamed user' } to={ Route.User.replace(':userId', user.id!) }/>,
        {
          update: checkAuthorization(UserPermission.Update, user) &&
            <AddUser user={ user } onSubmit={ refresh } iconButton/>,

          delete: checkAuthorization(UserPermission.Delete, user) &&
            <DeleteUser user={ user } onSubmit={ refresh } iconButton/>,
        },
      ] }
    />
  </>
}

export default memo(Users)