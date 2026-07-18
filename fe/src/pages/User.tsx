import { Breadcrumbs } from '@material-tailwind/react'
import { HomeIcon, UserCircleIcon } from '@heroicons/react/24/solid'
import { memo, useEffect, useState } from 'react'
import { Params, useParams } from 'react-router-dom'
import { apiQuery } from '../api/apolloClient'
import getUserForUserPage from '../api/users/getUserForUserPage'
import Error from '../components/Error'
import Spinner from '../components/Spinner'
import InfoTable from '../components/elements/InfoTable'
import Link from '../components/elements/Link'
import H1 from '../components/typography/H1'
import Route from '../enum/Route'
import UserSchema from '../schema/users/User'

const User = () => {
  const { userId } = useParams<Params>() as { userId: string }
  const [ user, setUser ] = useState<UserSchema>()
  const [ error, setError ] = useState<string>('')
  const [ _, setLoading ] = useState<boolean>(true)

  useEffect(() => {
    document.title = user?.name || 'User profile'
  }, [ user?.name ])

  useEffect(() => {
    apiQuery(
      getUserForUserPage(userId),
      (data: { user: UserSchema }) => setUser(data.user),
      setError,
      setLoading,
    )
  }, [ userId ])

  return <>
    <Breadcrumbs>
      <Link icon={ HomeIcon } label="Home" to={ Route.Home }/>
      <Link label="Users" to={ Route.Users }/>
      { user ? <Link label={ user.name || 'Unnamed user' } to={ Route.User.replace(':userId', userId) }/> : <Spinner type="text"/> }
    </Breadcrumbs>

    <H1 icon={ UserCircleIcon } label={ user?.name || <Spinner type="text"/> } sub="User profile"/>

    { error && <Error text={ error }/> }

    { user && <InfoTable
      title="Profile info"
      columns={ [ 'Name', 'Joined', 'Updated' ] }
      source={ user }
      mapper={ (profile: UserSchema) => [
        profile.name || 'Unnamed user',
        profile.createdAt ? new Date(profile.createdAt).toDateString() : 'N/A',
        profile.updatedAt ? new Date(profile.updatedAt).toDateString() : 'N/A',
      ] }
    /> }
  </>
}

export default memo(User)
