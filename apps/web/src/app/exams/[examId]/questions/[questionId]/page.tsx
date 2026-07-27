export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getQuestion } from '@/lib/ssrData'
import ErrorPage from '../../../../../components/ssr/ErrorPage'

export default async function Page({params}: { params: Promise<{ questionId: string }> }) {
  return renderQuestion((await params).questionId)
}

export async function renderQuestion(questionId: string) {
  const d = {question: await getQuestion(questionId)};
  if (!d.question) return <ErrorPage/>;
  return <><p><Link href={`/exams/${d.question.examId}`}>{d.question.exam?.name ?? 'Exam'}</Link></p>
    <h1>{d.question.title}</h1><p className="mt-2">{d.question.difficulty ?? 'Difficulty not set'}</p></>
}
