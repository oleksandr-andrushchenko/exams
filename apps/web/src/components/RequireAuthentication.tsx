import { Outlet } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import Spinner from './Spinner'
import Unauthorized from '../legacy-pages/Unauthorized'
import Unauthenticated from '../legacy-pages/Unauthenticated'
import { ComponentProps } from 'react'

interface Props extends ComponentProps<any> {
  permission?: any
}

export default function RequireAuthentication({ permission }: Props) {
  const { authenticationToken, me, checkAuthorization } = useAuth()

  if (!authenticationToken) {
    return <Unauthenticated/>
  }

  if (!me) {
    return <Spinner/>
  }

  if (permission && !checkAuthorization(permission)) {
    return <Unauthorized/>
  }

  return <Outlet/>
}