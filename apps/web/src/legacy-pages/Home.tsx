import { Breadcrumbs, Card, CardBody } from '@/components/bootstrap'
import { HomeIcon, TagIcon, UserGroupIcon, AcademicCapIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid'
import Route from '../enum/Route'
import { memo, useEffect, useState } from 'react'
import { apiQuery } from '../client/graphql/apolloClient'
import getHomeData from '../client/graphql/home/getHomeData'
import H1 from '../components/typography/H1'
import H2 from '../components/typography/H2'
import Link from '../components/elements/Link'
import Spinner from '../components/Spinner'
import Error from '../components/Error'
import Exam from '../schema/exam/Exam'
import ExamTag from '../schema/examTag/ExamTag'
import Question from '../schema/question/Question'
import User from '../schema/users/User'

interface HomeData { examTags: ExamTag[]; paginatedExams: { data: Exam[] }; paginatedQuestions: { data: Question[] }; paginatedUsers: { data: User[] } }
const score = (value?: { averageMark?: number } | null) => value?.averageMark || 0

const TagGrid = ({ tags }: { tags: ExamTag[] }) => <div className="row row-cols-1 row-cols-sm-3 row-cols-md-4 g-3">
 { tags.map(tag => <Link className="col" key={ tag.id } to={ Route.ExamTag.replace(':tagSlug', tag.slug) }>
 <div className="position-relative ratio ratio-16x9 overflow-hidden rounded bg-secondary ">
 { tag.imageFilename && <img src={ tag.imageFilename } alt="" className="h-100 w-100 object-fit-cover"/> }
 <div className="position-absolute top-0 bottom-0 start-0 end-0 d-flex align-items-end bg-dark bg-opacity-75 p-3"><span className="fw-semibold text-white">{ tag.name }</span></div>
 </div>
 </Link>) }
</div>

const ExamCards = ({ exams }: { exams: Exam[] }) => <div className="row row-cols-1 row-cols-md-2 g-3">
 { exams.map(exam => <div className="col"><Card key={ exam.id }><CardBody className="p-4">
 <Link label={ exam.name } to={ Route.Exam.replace(':examId', exam.id!) } className="fw-semibold"/>
 <div className="mt-2 small text-secondary">{ exam.approvedQuestionCount ?? 0 }/{ exam.questionCount ?? 0 } questions · score { exam.requiredScore ?? 0 }%</div>
 { exam.tags?.length ? <div className="mt-2 small text-secondary">{ exam.tags.map(tag => tag.name).join(' · ') }</div> : null }
 </CardBody></Card></div>) }
</div>

const QuestionCards = ({ questions }: { questions: Question[] }) => <div className="row row-cols-1 row-cols-md-2 g-3">
 { questions.map(question => <div className="col"><Card key={ question.id }><CardBody className="p-4">
 <Link label={ question.title } to={ Route.Question.replace(':examId', question.exam?.id || question.examId || '').replace(':questionId', question.id!) } className="fw-semibold"/>
 <div className="mt-1 small text-secondary">{ question.exam?.name || 'Exam' } · { question.difficulty || 'Difficulty not set' }</div>
 </CardBody></Card></div>) }
</div>

const UserCards = ({ users }: { users: User[] }) => <div className="row row-cols-1 row-cols-md-2 g-3">
 { users.map(user => <div className="col"><Card key={ user.id }><CardBody className="p-4">
 <Link label={ user.name || 'Unnamed user' } to={ Route.User.replace(':userId', user.id!) } className="fw-semibold"/>
 <div className="mt-1 small text-secondary">Joined { user.createdAt ? new Date(user.createdAt).toDateString() : 'recently' }</div>
 </CardBody></Card></div>) }
</div>

const Home = () => {
 const [ data, setData ] = useState<HomeData>()
 const [ error, setError ] = useState('')
 const [ loading, setLoading ] = useState(true)
 useEffect(() => { document.title = 'ExamMe' }, [])
 useEffect(() => { apiQuery(getHomeData(), setData, setError, setLoading) }, [])

 const tags = data?.examTags || []
 const exams = data?.paginatedExams.data || []
 const questions = data?.paginatedQuestions.data || []
 const users = data?.paginatedUsers.data || []
 const popularExams = [ ...exams ].sort((a, b) => score(b.rating) - score(a.rating)).slice(0, 6)
 const popularQuestions = [ ...questions ].sort((a, b) => score(b.rating) - score(a.rating)).slice(0, 6)

 return <>
 <Breadcrumbs><Link icon={ HomeIcon } label="Home" to={ Route.Home }/></Breadcrumbs>
 <H1 label="Home" sub="Explore exams, questions, and the ExamMe community"/>
 { error && <Error text={ error }/> }
 { loading ? <Spinner/> : <div className="row g-5">
 <main className="d-flex flex-column gap-2 col-xl-8">
 <section><H2 icon={ TagIcon } label="Popular topics"/><TagGrid tags={ tags.slice(0, 8) }/></section>
 <section><H2 icon={ AcademicCapIcon } label="Popular exams"/><ExamCards exams={ popularExams }/></section>
 <section><H2 icon={ QuestionMarkCircleIcon } label="Popular questions"/><QuestionCards questions={ popularQuestions }/></section>
 <section><H2 icon={ UserGroupIcon } label="Popular users"/><UserCards users={ users.slice(0, 6) }/></section>
 </main>
 <aside className="col-xl-4 d-flex flex-column gap-2">
 <section><H2 label="Latest exams"/><ExamCards exams={ exams.slice(0, 5) }/></section>
 <section><H2 label="Latest questions"/><QuestionCards questions={ questions.slice(0, 5) }/></section>
 <section><H2 label="Latest tags"/><TagGrid tags={ tags.slice(0, 5) }/></section>
 <section><H2 label="Latest users"/><UserCards users={ users.slice(0, 5) }/></section>
 </aside>
 </div> }
 </>
}

export default memo(Home)
