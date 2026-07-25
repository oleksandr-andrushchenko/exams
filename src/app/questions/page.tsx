export const dynamic = 'force-dynamic'

import { renderQuestions } from '../_pages'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function Page({ searchParams }: Props) {
  const raw = await searchParams
  const params = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]))
  return renderQuestions(params)
}
