'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type User = { id?: string; email?: string; name?: string }
type Token = { token?: string }
const apiUrl = '/graphql'

export default function SiteHeader() {
  const [user, setUser] = useState<User>()
  const [loadingUser, setLoadingUser] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      const raw = localStorage.getItem('authenticationToken')
      if (!raw) {
        setUser(undefined);
        setLoadingUser(false);
        return
      }
      try {
        const token = JSON.parse(raw) as Token
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {'content-type': 'application/json', authorization: `Bearer ${token.token}`},
          body: JSON.stringify({query: 'query CurrentUser { me { id email name } }'})
        })
        const result = await response.json()
        if (result.errors?.length || !result.data?.me) throw new Error('Invalid session')
        setUser(result.data.me)
      } catch {
        localStorage.removeItem('authenticationToken');
        setUser(undefined)
      } finally {
        setLoadingUser(false)
      }
    }
    loadUser()
    const refresh = () => loadUser()
    window.addEventListener('auth-changed', refresh)
    return () => window.removeEventListener('auth-changed', refresh)
  }, [])

  const logout = () => {
    localStorage.removeItem('authenticationToken');
    setUser(undefined);
    window.dispatchEvent(new Event('auth-changed'))
  }

  const closeMenu = () => setMenuOpen(false)

  return <header>
    <nav className="navbar navbar-expand-md bg-light">
      <div className="container">
        <Link className="navbar-brand link-secondary" href="/">Exam Me</Link>
        <button className="navbar-toggler" type="button" aria-controls="main-navigation" aria-expanded={menuOpen}
                aria-label="Toggle navigation" onClick={() => setMenuOpen(!menuOpen)}>
          <span className="navbar-toggler-icon"/>
        </button>
        <div className={menuOpen ? "collapse navbar-collapse show" : "collapse navbar-collapse"} id="main-navigation">
          <ul className="navbar-nav me-auto">
            <li className="nav-item"><Link className="nav-link" href="/exams" onClick={closeMenu}>Exams</Link></li>
            <li className="nav-item"><Link className="nav-link" href="/questions" onClick={closeMenu}>Questions</Link>
            </li>
            <li className="nav-item"><Link className="nav-link" href="/users" onClick={closeMenu}>Users</Link></li>
          </ul>
          <ul className="navbar-nav">
            {loadingUser ?
                    <li className="nav-item"><span className="nav-link disabled">Loading...</span></li> : user ? <>
                      <li className="nav-item"><Link className="nav-link" href={"/users/" + user.id}
                                                     onClick={closeMenu}>{user.email || user.name}</Link></li>
                      <li className="nav-item">
                        <button className="btn btn-link nav-link" onClick={logout}>Logout</button>
                      </li>
                    </> : <li className="nav-item"><Link className="nav-link" href="/login" onClick={closeMenu}>Sign
                      in</Link></li>}
          </ul>
        </div>
      </div>
    </nav>
  </header>
}
