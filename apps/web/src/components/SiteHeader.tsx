'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

type User = { id?: string; email?: string; name?: string }
type Token = { token?: string }
const apiUrl = '/graphql'

export default function SiteHeader() {
  const [user, setUser] = useState<User>()
  const [loadingUser, setLoadingUser] = useState(true)

  useEffect(() => {
    const loadUser = async () => {
      const raw = localStorage.getItem('authenticationToken')
      if (!raw) { setUser(undefined); setLoadingUser(false); return }
      try {
        const token = JSON.parse(raw) as Token
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token.token}` }, body: JSON.stringify({ query: 'query CurrentUser { me { id email name } }' }) })
        const result = await response.json()
        if (result.errors?.length || !result.data?.me) throw new Error('Invalid session')
        setUser(result.data.me)
      } catch { localStorage.removeItem('authenticationToken'); setUser(undefined) } finally { setLoadingUser(false) }
    }
    loadUser()
    const refresh = () => loadUser()
    window.addEventListener('auth-changed', refresh)
    return () => window.removeEventListener('auth-changed', refresh)
  }, [])

  const logout = () => { localStorage.removeItem('authenticationToken'); setUser(undefined); window.dispatchEvent(new Event('auth-changed')) }

  return <header className="h-max max-w-full rounded-none border-b bg-white px-4 py-2 text-black lg:px-8 lg:py-4"><nav className="mx-auto flex max-w-7xl items-center justify-between text-blue-gray-900 sm:px-6 lg:px-8">
    <Link className="font-secondary text-xl" href="/">Exam Me</Link>
    <div className="flex items-center gap-4 text-sm text-blue-gray-900"><Link href="/exams">Exams</Link><Link href="/questions">Questions</Link><Link href="/users">Users</Link>{loadingUser ? <span>Loading...</span> : user ? <><Link href={`/users/${user.id}`}>{user.email || user.name}</Link><button onClick={logout}>Logout</button></> : <a href="/login">Login</a>}</div>
  </nav></header>
}
