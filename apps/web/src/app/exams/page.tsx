export const dynamic = 'force-dynamic'

import { getExamList } from '@/lib/ssrData.ts'
import SsrListControls from '../../components/SsrListControls'
import ExamList from '../../components/ssr/ExamList'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function Page({searchParams}: Props) {
  const raw = await searchParams
  const params = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]))
  return renderExams(params)
}

export async function renderExams(params: Record<string, string | undefined> = {}) {
  const d = await getExamList(params);
  return <><h1>Exams</h1><SsrListControls filters={params as Record<string, string>} page={d.page} size={d.size}
                                          hasNext={d.hasNext} options={{
    approved: [{value: 'yes', label: 'Approved'}, {
      value: 'no',
      label: 'Unapproved'
    }]
  }}/><ExamList exams={d.data}/></>
}
