import type { Metadata } from 'next'
import SiteHeader from '../components/SiteHeader'
import PageBreadcrumbs from '../components/PageBreadcrumbs'
import './globals.css'

export const metadata: Metadata = {title: 'ExamMe'}

export default function RootLayout({children}: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en">
  <body>
  <SiteHeader/>
  <main>
    <div className="container pb-3"><PageBreadcrumbs/>{children}</div>
  </main>
  </body>
  </html>
}
