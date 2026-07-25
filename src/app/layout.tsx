import type { Metadata } from 'next'
import SiteHeader from '../components/SiteHeader'
import './globals.css'

export const metadata: Metadata = { title: 'ExamMe' }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>
    <SiteHeader/>
    <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">{children}</main>
  </body></html>
}
