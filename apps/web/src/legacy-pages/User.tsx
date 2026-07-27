import { Breadcrumbs } from '@/components/bootstrap'
import { HomeIcon, UserCircleIcon } from '@heroicons/react/24/solid'
import { memo, useEffect, useState } from 'react'
import { Params, useParams } from 'react-router-dom'
import { apiQuery } from '../client/graphql/apolloClient'
import getUserForUserPage from '../client/graphql/users/getUserForUserPage'
import getExamsForExamsPage from '../client/graphql/exam/getExamsForExamsPage'
import getExamSessionsForUserPage from '../client/graphql/examSession/getExamSessionsForUserPage'
import Error from '../components/Error'
import Spinner from '../components/Spinner'
import InfoTable from '../components/elements/InfoTable'
import Table from '../components/elements/Table'
import H2 from '../components/typography/H2'
import Paginated from '../schema/pagination/Paginated'
import Exam from '../schema/exam/Exam'
import ExamSession from '../schema/examSession/ExamSession'
import Link from '../components/elements/Link'
import H1 from '../components/typography/H1'
import Route from '../enum/Route'
import UserSchema from '../schema/users/User'

const User = () => {
  const { userId } = useParams<Params>() as { userId: string }
  const [ user, setUser ] = useState<UserSchema>()
  const [ error, setError ] = useState<string>('')
  const [ _, setLoading ] = useState<boolean>(true)

  useEffect(() => {
    document.title = user?.name || 'User profile'
  }, [ user?.name ])

  useEffect(() => {
    apiQuery(
      getUserForUserPage(userId),
      (data: { user: UserSchema }) => setUser(data.user),
      setError,
      setLoading,
    )
  }, [ userId ])

  return <>
    <Breadcrumbs>
      <Link icon={ HomeIcon } label="Home" to={ Route.Home }/>
      <Link label="Users" to={ Route.Users }/>
      { user ? <Link label={ user.name || 'Unnamed user' } to={ Route.User.replace(':userId', userId) }/> : <Spinner type="text"/> }
    </Breadcrumbs>

    <H1 icon={ UserCircleIcon } label={ user?.name || <Spinner type="text"/> } sub="User profile"/>

    { error && <Error text={ error }/> }

    { user && <InfoTable
      title="Profile info"
      columns={ [ 'Name', 'Joined', 'Updated' ] }
      source={ user }
      mapper={ (profile: UserSchema) => [
        profile.name || 'Unnamed user',
        profile.createdAt ? new Date(profile.createdAt).toDateString() : 'N/A',
        profile.updatedAt ? new Date(profile.updatedAt).toDateString() : 'N/A',
      ] }
    /> }

    { user && <>
      <H2 label="Exams"/>
      <Table
        key2={ userId }
        columns={ [ '#', 'Name', 'Tags', 'Questions', 'Required score', 'Rating' ] }
        queryOptions={ filter => getExamsForExamsPage({ ...filter, userId }) }
        queryData={ (data: { paginatedExams: Paginated<Exam> }) => data.paginatedExams }
        mapper={ (exam: Exam, index: number) => [
          exam.id,
          index + 1,
          <Link label={ exam.name } to={ Route.Exam.replace(':examId', exam.id!) }/>,
          exam.tags?.map(tag => tag.name).join(', ') || '—',
          `${ exam.approvedQuestionCount ?? 0 }/${ exam.questionCount ?? 0 }`,
          exam.rating?.averageMark ?? 'N/A',
        ] }
      />

      <H2 label="Exam sessions"/>
      <Table
        key2={ userId }
        columns={ [ '#', 'Exam', 'Progress', 'Score', 'Status', 'Started' ] }
        queryOptions={ filter => getExamSessionsForUserPage(userId, filter) }
        queryData={ (data: { paginatedExamSessions: Paginated<ExamSession> }) => data.paginatedExamSessions }
        mapper={ (session: ExamSession, index: number) => [
          session.id,
          index + 1,
          session.exam ? <Link label={ session.exam.name } to={ Route.Exam.replace(':examId', session.exam.id!) }/> : session.examId,
          `${ session.answeredQuestionCount ?? 0 }/${ session.questionCount ?? 0 }`,
          session.correctAnswerCount ?? '—',
          session.completedAt ? 'Completed' : 'In progress',
          session.createdAt ? new Date(session.createdAt).toDateString() : 'N/A',
        ] }
      />
    </> }
  </>
}

export default memo(User)
