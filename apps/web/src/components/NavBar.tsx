import { ArrowRightStartOnRectangleIcon, Bars3Icon, UserCircleIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { memo, useEffect, useState } from 'react'
import { Collapse, Navbar, Typography } from '@/components/bootstrap'
import useAuth from '../hooks/useAuth'
import Route from '../enum/Route'
import Spinner from './Spinner'
import Auth from './Auth'
import { FolderPlus as LogoIcon } from 'react-bootstrap-icons'
import Link from './elements/Link'
import Button from './elements/Button'
import IconButton from './elements/IconButton'
import Text from './typography/Text'

const NavBar = () => {
  const links = [
    {name: 'Exams', href: Route.Exams},
    {name: 'Questions', href: Route.Questions},
    {name: 'Users', href: Route.Users},
  ]
  const [openNav, setOpenNav] = useState<boolean>(false)
  const {authenticationToken, me, setAuthenticationToken} = useAuth()

  useEffect(() => {
    window.addEventListener(
            'resize',
            () => window.innerWidth >= 960 && setOpenNav(false),
    )
  }, [])

  const navList = <ul
          className="mt-2 mb-4 d-flex flex-column gap-2 mb-lg-0 mt-lg-0 d-lg-flex flex-row align-items-center gap-lg-3">
    {links.map(({name, href}) => {
      return <Typography as="li" key={href} variant="small" color="blue-gray" className="p-1 fw-normal">
        <Link label={name} to={href} className="d-flex align-items-center"/>
      </Typography>
    })}
    {authenticationToken && !me
            ? <Typography as="li" variant="small"><Spinner type="text"/></Typography>
            : (
                    me
                            ? <>
                              <Typography as="li" variant="small" className="truncate">
                                {me.id
                                        ? <Link to={Route.User.replace(":userId", me.id)} className="d-flex align-items-center"
                                                aria-label="Open your profile">
                                          <Text icon={UserCircleIcon} label={me.email} variant="small" className="fw-normal"/>
                                        </Link>
                                        : <Text icon={UserCircleIcon} label={me.email} variant="small" className="fw-normal"/>}
                              </Typography>
                              <Typography as="li" variant="small">
                                <Button icon={ArrowRightStartOnRectangleIcon} label="Logout"
                                        onClick={() => setAuthenticationToken(undefined)}/>
                              </Typography>
                            </>
                            : <>
                              <li><Auth/></li>
                              <li><Auth register/></li>
                            </>
            )}
  </ul>

  return (
          <Navbar className=" w-100 rounded-0 px-4 py-2 px-lg-5 py-lg-4 text-black" fullWidth={true}>
            <div className="container mx-auto container px-4 px-lg-5 d-flex align-items-center justify-content-between text-secondary">
              <Link icon={LogoIcon} iconSize="10" label="Exam Me" to={Route.Home}
                    className="d-inline-flex align-items-center gap-1 fs-5"/>
              <div className="d-flex align-items-center gap-4">
                <div className="d-none d-lg-block">{navList}</div>
                <IconButton
                        icon={openNav ? XMarkIcon : Bars3Icon}
                        variant="text"
                        className="ms-auto  text-inherit d-lg-none"
                        onClick={() => setOpenNav(!openNav)}
                />
              </div>
            </div>
            <Collapse open={openNav}>
              {navList}
            </Collapse>
          </Navbar>
  )
}

export default memo(NavBar)
