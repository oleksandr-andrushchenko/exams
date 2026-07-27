export const dynamic = 'force-dynamic'

import { getExamOptions, getQuestionList } from '../../lib/ssrData'
import SsrListControls from '../../components/SsrListControls'
import QuestionList from '../../components/ssr/QuestionList'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function Page({searchParams}: Props) {
  const raw = await searchParams
  const params = Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value]))
  return renderQuestions(params)
}

export async function renderQuestions(params: Record<string, string | undefined> = {}) {
  const [d, exams] = await Promise.all([getQuestionList(params), getExamOptions()]);
  return <><h1>Questions</h1><SsrListControls filters={params as Record<string, string>} page={d.page} size={d.size}
                                              hasNext={d.hasNext} options={{
    approved: [{value: 'yes', label: 'Approved'}, {
      value: 'no',
      label: 'Unapproved'
    }],
    exam: exams.map(exam => ({value: exam.id, label: exam.name})),
    difficulty: [{value: 'easy', label: 'Easy'}, {value: 'moderate', label: 'Moderate'}, {
      value: 'difficult',
      label: 'Difficult'
    }, {value: 'expert', label: 'Expert'}],
    type: [{value: 'choice', label: 'Choice'}]
  }}/><QuestionList questions={d.data}/></>
}
