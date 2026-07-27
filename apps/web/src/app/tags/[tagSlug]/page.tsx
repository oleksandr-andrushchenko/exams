export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getTag } from '@/lib/ssrData.ts'
import ErrorPage from '../../../components/ssr/ErrorPage'

export default async function Page({params}: { params: Promise<{ tagSlug: string }> }) {
  return renderTag((await params).tagSlug)
}

export async function renderTag(tagSlug: string) {
  const tag = await getTag(tagSlug);
  return tag ? <><h1>{tag.name}</h1><p className="mt-2"><Link href={`/exams?tag=${tag.slug}`}>View exams
    tagged {tag.name}</Link></p></> : <ErrorPage/>
}
