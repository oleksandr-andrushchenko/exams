export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getUser, getUserExams, getUserExamSessions } from '@/lib/ssrData.ts'
import ErrorPage from '../../../components/ssr/ErrorPage'
import ExamList from '../../../components/ssr/ExamList'

export default async function Page({params}: { params: Promise<{ userId: string }> }) {
  return renderUser((await params).userId)
}

export async function renderUser(userId: string) {
  const [user, exams, sessions] = await Promise.all([getUser(userId), getUserExams(userId), getUserExamSessions(userId)])
  if (!user) return <ErrorPage/>
  return <><h1>{user.name || 'User profile'}</h1><p
          className="mt-2">Joined {user.createdAt ? new Date(user.createdAt).toDateString() : 'recently'}{user.updatedAt ? ` · Updated ${new Date(user.updatedAt).toDateString()}` : ''}</p>
    <section className="mt-5"><h2>Exams</h2><ExamList exams={exams.data}/></section>
    <section className="mt-5"><h2>Exam sessions</h2>
      <div className="card">
        <div className="card-body p-0 overflow-auto">
          <table className="w-100 text-start small">
            <thead>
            <tr>
              <th className="p-3">Exam</th>
              <th className="p-3">Progress</th>
              <th className="p-3">Score</th>
              <th className="p-3">Status</th>
              <th className="p-3">Started</th>
            </tr>
            </thead>
            <tbody>{sessions.map(session => <tr key={session.id} className="border-top">
              <td className="p-3">{session.exam ?
                      <Link href={`/exams/${session.exam.id}`}>{session.exam.name}</Link> : session.examId}</td>
              <td className="p-3">{session.answeredQuestionCount}/{session.questionCount}</td>
              <td className="p-3">{session.correctAnswerCount ?? '—'}</td>
              <td className="p-3">{session.completedAt ? 'Completed' : 'In progress'}</td>
              <td className="p-3">{session.createdAt ? new Date(session.createdAt).toDateString() : 'N/A'}</td>
            </tr>)}</tbody>
          </table>
          {sessions.length === 0 && <p className="p-4">No exam sessions.</p>}</div>
      </div>
    </section>
  </>
}
