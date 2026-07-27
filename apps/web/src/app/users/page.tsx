export const dynamic = 'force-dynamic'

import { getUserList } from '@/lib/ssrData.ts'
import SsrListControls from '../../components/SsrListControls'
import UserList from '../../components/ssr/UserList'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function Page({searchParams}: Props) {
  const raw = await searchParams
  const params = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]))
  return renderUsers(params)
}

async function renderUsers(params: Record<string, string | undefined> = {}) {
  const d = await getUserList(params)
  return <><h1>Users</h1><SsrListControls filters={params as Record<string, string>} page={d.page} size={d.size}
                                          hasNext={d.hasNext}/><UserList users={d.data}/></>
}
