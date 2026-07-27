import Link from 'next/link'

type Question = { id: string; examId?: string; title: string; difficulty?: string }
export default function QuestionList({questions}: { questions: Question[] }) {
  return <div className="row row-cols-1 row-cols-md-2 g-3">{questions.map(q => <article className="col" key={q.id}>
    <div className="card h-100">
      <div className="card-body"><Link className="fw-semibold"
                                       href={`/exams/${q.examId}/questions/${q.id}`}>{q.title}</Link>
        <p>{q.difficulty ?? 'Difficulty not set'}</p></div>
    </div>
  </article>)}</div>
}
