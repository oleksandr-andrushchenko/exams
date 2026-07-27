import Link from 'next/link'

type Exam = { id: string; name: string; questionCount?: number; approvedQuestionCount?: number; requiredScore?: number }
export default function ExamList({exams}: { exams: Exam[] }) {
  return <div className="row row-cols-1 row-cols-md-2 g-3">{exams.map(e => <article className="col" key={e.id}>
    <div className="card h-100">
      <div className="card-body"><Link className="fs-5 fw-semibold"
                                       href={`/exams/${e.id}`}>{e.name}</Link>
        <p>{e.approvedQuestionCount ?? 0}/{e.questionCount ?? 0} questions · required score {e.requiredScore ?? 0}%</p>
      </div>
    </div>
  </article>)}</div>
}
