import NavBar from './NavBar'
import { Outlet } from 'react-router-dom'
import { memo } from 'react'

const Layout = () => {
  return (
          <div className="min-vh-100">
            <NavBar/>
            <main className="mx-auto container py-4 px-4 px-lg-5">
              <Outlet/>
            </main>
          </div>
  )
}

export default memo(Layout)