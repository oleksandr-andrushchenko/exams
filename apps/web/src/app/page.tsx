export const dynamic = "force-dynamic"
import Link from "next/link"
import { getHomeData } from "../lib/ssrData"
import ExamList from "../components/ssr/ExamList"
import QuestionList from "../components/ssr/QuestionList"

export default async function Page() {
  const d = await getHomeData(8)
  const exams = d.exams, questions = d.questions, tags = d.tags
  return <>
    <div className="row g-5 pt-4">
      <div className="col-12 col-xl-8 d-flex flex-column gap-2">
        <h1>Home</h1><p className="text-secondary">Explore exams, questions, and the ExamMe community.</p>
        <section><h2>Popular topics</h2>
          <div className="mt-3 row row-cols-1 row-cols-sm-3 row-cols-md-4">{tags.slice(0, 8).map(t => <div
                  className="col" key={t.id}>
            <Link className="ratio ratio-16x9 rounded border bg-light text-decoration-none link-body-emphasis"
                  href={"/tags/" + t.slug}>
              <span
                      className="d-flex align-items-center justify-content-center text-center px-2 fw-semibold text-muted">{t.name}</span>
            </Link>
          </div>)}</div>
        </section>
        <section><h2>Popular exams</h2>
          <div className="mt-3"><ExamList exams={exams.slice(0, 6)}/></div>
        </section>
        <section><h2>Popular questions</h2>
          <div className="mt-3"><QuestionList questions={questions.slice(0, 6)}/></div>
        </section>
      </div>
      <aside className="col-12 col-xl-4 border-start ps-xl-4 d-flex flex-column gap-2">
        <section><h2>Latest exams</h2>
          <div className="mt-3"><ExamList exams={exams.slice(0, 5)}/></div>
        </section>
        <section><h2>Latest questions</h2>
          <div className="mt-3"><QuestionList questions={questions.slice(0, 5)}/></div>
        </section>
        <section><h2>Latest tags</h2>
          <div className="mt-3 d-flex flex-wrap gap-3">{tags.slice(0, 5).map(t => <Link
                  className="badge text-bg-secondary" href={`/tags/${t.slug}`}
                  key={t.id}>{t.name}</Link>)}</div>
        </section>
      </aside>
    </div>
  </>
}
