'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const labels: Record<string, string> = {
  exams: 'Exams',
  questions: 'Questions',
  users: 'Users',
  tags: 'Tags',
  examSessions: 'Exam sessions',
  login: 'Login',
  register: 'Register',
  'terms-and-conditions': 'Terms and conditions'
}

export default function PageBreadcrumbs() {
  const pathname = usePathname()
  if (pathname === '/') return null
  const segments = pathname.split('/').filter(Boolean)
  let href = ''
  return <nav aria-label='breadcrumb'>
    <ol className='breadcrumb mb-4'>
      <li className='breadcrumb-item'><Link href='/'>Home</Link></li>
      {segments.map((segment, index) => {
        href += `/${segment}`
        const label = labels[segment] || (index === segments.length - 1 ? 'Details' : segment)
        const current = index === segments.length - 1
        return <li className={`breadcrumb-item ${current ? 'active' : ''}`} aria-current={current ? 'page' : undefined}
                   key={href}>{current ? label : <Link href={href}>{label}</Link>}</li>
      })}
    </ol>
  </nav>
}
