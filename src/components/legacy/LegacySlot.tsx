'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

const LegacyApp = dynamic(() => import('./LegacyApp'), { ssr: false })
export default function LegacySlot() {
  const pathname = usePathname()
  return <LegacyApp key={pathname} />
}
