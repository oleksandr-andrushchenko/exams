'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthPage({mode}: { mode: 'login' | 'register' }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const register = mode === 'register'

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (register && password !== confirmPassword) {
      setError('Passwords do not match');
      return
    }
    setSubmitting(true)
    const mutation = register
            ? 'mutation Register($createMe: CreateMe!, $credentials: Credentials!) { createMe(createMe: $createMe) { id } createAuthenticationToken(credentials: $credentials) { token } }'
            : 'mutation Login($email: String!, $password: String!) { createAuthenticationToken(credentials: { email: $email, password: $password }) { token } }'
    try {
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({
          query: mutation,
          variables: register ? {createMe: {email, password}, credentials: {email, password}} : {email, password}
        })
      })
      const responseText = await response.text()
      let result: { data?: { createAuthenticationToken?: { token?: string } }; errors?: Array<{ message?: string }> }
      try {
        result = JSON.parse(responseText)
      } catch {
        throw new Error(responseText || `Authentication request failed (${response.status})`)
      }
      if (!response.ok) throw new Error(result.errors?.[0]?.message || `Authentication request failed (${response.status})`)
      if (result.errors?.length) throw new Error(result.errors[0].message || 'Authentication failed')
      const token = result.data?.createAuthenticationToken
      if (!token?.token) throw new Error('Authentication response did not include a token')
      localStorage.setItem('authenticationToken', JSON.stringify(token))
      window.dispatchEvent(new Event('auth-changed'))
      await new Promise(resolve => setTimeout(resolve, 400))
      router.push('/')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed')
    } finally {
      setSubmitting(false)
    }
  }

  return <section className="mx-auto col-12 col-md-8 col-lg-6">
    <div className="card">
      <div className="card-body">
        <h1>{register ? 'Register' : 'Login'}</h1>
        <form className="d-flex flex-column gap-2" onSubmit={submit}>
          <label className="d-block">Email<input className="form-control mt-1" type="email" required value={email}
                                                 onChange={e => setEmail(e.target.value)}/></label>
          <label className="d-block">Password<input className="form-control mt-1" type="password" required
                                                    value={password}
                                                    onChange={e => setPassword(e.target.value)}/></label>
          {register && <label className="d-block">Confirm password<input className="form-control mt-1" type="password"
                                                                         required value={confirmPassword}
                                                                         onChange={e => setConfirmPassword(e.target.value)}/></label>}
          {error && <p className="text-danger">{error}</p>}
          <button className="btn btn-primary" disabled={submitting}
                  type="submit">{submitting ? 'Please wait...' : register ? 'Register' : 'Login'}</button>
        </form>
      </div>
    </div>
  </section>
}
