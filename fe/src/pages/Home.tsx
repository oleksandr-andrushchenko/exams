import { Breadcrumbs, Card, CardBody } from '@material-tailwind/react'
import { HomeIcon, TagIcon, UserGroupIcon, AcademicCapIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/solid'
import Route from '../enum/Route'
import { memo, useEffect, useState } from 'react'
import { apiQuery } from '../api/apolloClient'
import getHomeData from '../api/home/getHomeData'
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

const TagGrid = ({ tags }: { tags: ExamTag[] }) => <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
  { tags.map(tag => <Link key={ tag.id } to={ Route.ExamTag.replace(':tagSlug', tag.slug) }>
    <div className="relative h-28 overflow-hidden rounded-lg bg-gradient-to-br from-blue-gray-500 to-blue-gray-800 shadow transition hover:shadow-lg">
      { tag.imageFilename && <img src={ tag.imageFilename } alt="" className="h-full w-full object-cover"/> }
      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/75 to-transparent p-3"><span className="font-semibold text-white">{ tag.name }</span></div>
    </div>
  </Link>) }
</div>

const ExamCards = ({ exams }: { exams: Exam[] }) => <div className="grid gap-3 sm:grid-cols-2">
  { exams.map(exam => <Card key={ exam.id }><CardBody className="p-4">
    <Link label={ exam.name } to={ Route.Exam.replace(':examId', exam.id!) } className="font-semibold"/>
    <div className="mt-2 text-sm text-blue-gray-600">{ exam.approvedQuestionCount ?? 0 }/{ exam.questionCount ?? 0 } questions · score { exam.requiredScore ?? 0 }%</div>
    { exam.tags?.length ? <div className="mt-2 text-xs text-blue-gray-500">{ exam.tags.map(tag => tag.name).join(' · ') }</div> : null }
  </CardBody></Card>) }
</div>

const QuestionCards = ({ questions }: { questions: Question[] }) => <div className="space-y-2">
  { questions.map(question => <Card key={ question.id }><CardBody className="p-4">
    <Link label={ question.title } to={ Route.Question.replace(':examId', question.exam?.id || question.examId || '').replace(':questionId', question.id!) } className="font-semibold"/>
    <div className="mt-1 text-sm text-blue-gray-600">{ question.exam?.name || 'Exam' } · { question.difficulty || 'Difficulty not set' }</div>
  </CardBody></Card>) }
</div>

const UserCards = ({ users }: { users: User[] }) => <div className="grid gap-3 sm:grid-cols-2">
  { users.map(user => <Card key={ user.id }><CardBody className="p-4">
    <Link label={ user.name || 'Unnamed user' } to={ Route.User.replace(':userId', user.id!) } className="font-semibold"/>
    <div className="mt-1 text-sm text-blue-gray-600">Joined { user.createdAt ? new Date(user.createdAt).toDateString() : 'recently' }</div>
  </CardBody></Card>) }
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
    { loading ? <Spinner/> : <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
      <main className="space-y-8 xl:col-span-2">
        <section><H2 icon={ TagIcon } label="Popular topics"/><TagGrid tags={ tags.slice(0, 8) }/></section>
        <section><H2 icon={ AcademicCapIcon } label="Popular exams"/><ExamCards exams={ popularExams }/></section>
        <section><H2 icon={ QuestionMarkCircleIcon } label="Popular questions"/><QuestionCards questions={ popularQuestions }/></section>
        <section><H2 icon={ UserGroupIcon } label="Popular users"/><UserCards users={ users.slice(0, 6) }/></section>
      </main>
      <aside className="space-y-8">
        <section><H2 label="Latest exams"/><ExamCards exams={ exams.slice(0, 5) }/></section>
        <section><H2 label="Latest questions"/><QuestionCards questions={ questions.slice(0, 5) }/></section>
        <section><H2 label="Latest tags"/><TagGrid tags={ tags.slice(0, 5) }/></section>
        <section><H2 label="Latest users"/><UserCards users={ users.slice(0, 5) }/></section>
      </aside>
    </div> }
  </>
}

export default memo(Home)
