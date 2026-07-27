export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getExam } from '@/lib/ssrData.ts'
import ErrorPage from '../../../components/ssr/ErrorPage'

export default async function Page({params}: { params: Promise<{ examId: string }> }) {
  return renderExam((await params).examId)
}

export async function renderExam(examId: string) {
  const d = {exam: await getExam(examId)};
  if (!d.exam) return <ErrorPage/>;
  return <><h1>{d.exam.name}</h1><p
          className="mt-2">{d.exam.approvedQuestionCount ?? 0}/{d.exam.questionCount ?? 0} approved questions · required
    score {d.exam.requiredScore ?? 0}%</p>
    <div className="mt-4 d-flex gap-2">{(d.exam.tags ?? []).map(t => <Link className="col" href={"/tags/" + t.slug}
                                                                           key={t.id}>{t.name}</Link>)}</div>
  </>
}
