import { useNavigate } from 'react-router-dom'
import { Breadcrumbs } from '@material-tailwind/react'
import Exam from '../schema/exam/Exam'
import Route from '../enum/Route'
import useAuth from '../hooks/useAuth'
import { HomeIcon } from '@heroicons/react/24/solid'
import { memo, useEffect, useState } from 'react'
import AddExam from '../components/exam/AddExam'
import AddQuestion from '../components/question/AddQuestion'
import DeleteExam from '../components/exam/DeleteExam'
import Paginated from '../schema/pagination/Paginated'
import getExamsForExamsPage from '../api/exam/getExamsForExamsPage'
import AddExamSession from '../components/examSession/AddExamSession'
import ExamPermission from '../enum/exam/ExamPermission'
import H1 from '../components/typography/H1'
import { ListIcon } from '../registry/icons'
import Table from '../components/elements/Table'
import Link from '../components/elements/Link'
import { ApproveExam } from '../components/exam/ApproveExam'
import { default as YesNoEnum } from '../enum/YesNo'
import canAddExamSession from '../services/examSessions/canAddExamSession'
import CreatorBadge from '../components/badges/CreatorBadge'
import { RateExam } from '../components/exam/RateExam'
import ExamTags from '../components/examTag/ExamTags'

const Exams = ({ tagSlug }: { tagSlug?: string }) => {
  const tagName = tagSlug?.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
  const [ tableKey, setTableKey ] = useState<number>(0)
  const refresh = () => setTableKey(Math.random())
  const { authenticationToken, checkAuthorization } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    refresh()
  }, [ authenticationToken ])

  useEffect(() => {
    document.title = tagName ? tagName + ' Exams' : 'Exams'
  }, [ tagName ])

  return <>
    <Breadcrumbs>
      <Link icon={ HomeIcon } label="Home" to={ Route.Home }/>
      <Link label="Exams" to={ Route.Exams }/>
      { tagSlug && <Link label={ tagName } to={ Route.ExamTag.replace(':tagSlug', tagSlug) }/> }
    </Breadcrumbs>

    <H1 icon={ ListIcon } label={ tagName ? 'Exams tagged ' + tagName : 'Exams' } sub={ tagName ? 'All exams with the ' + tagName + ' tag' : 'Exams info' }/>

    <Table
      key2={ tableKey }
      buttons={ {
        create: <AddExam
          onSubmit={ (exam: Exam) => navigate(Route.Exam.replace(':examId', exam.id!)) }/>,
      } }
      tabs={ {
        // subscription: Object.values(YesNoEnum),
        approved: Object.values(YesNoEnum),
        // creator: authenticationToken ? Object.values(Creator) : '',
      } }
      columns={ [ '#', 'Name', 'Tags', 'Questions', 'Required score', 'Approved', 'Rating', '' ] }
      queryOptions={ (filter) => getExamsForExamsPage({ ...filter, tag: tagSlug }) }
      queryData={ (data: { paginatedExams: Paginated<Exam> }) => data.paginatedExams }
      mapper={ (exam: Exam, index: number) => [
        exam.id,
        index + 1,
        <Link
          label={ exam.name }
          sup={ exam.isCreator ? <CreatorBadge/> : '' }
          tooltip={ exam.name }
          to={ Route.Exam.replace(':examId', exam.id!) }
        />,
        <ExamTags tags={ exam.tags }/>,
        `${ exam.approvedQuestionCount ?? 0 }/${ exam.questionCount ?? 0 }`,
        exam.requiredScore ?? 0,
        <ApproveExam exam={ exam } readonly={ !checkAuthorization(ExamPermission.Approve) }
                         iconButton/>,
        <RateExam exam={ exam } readonly={ !checkAuthorization(ExamPermission.Rate) }/>,
        {
          addQuestion: <AddQuestion exam={ exam } onSubmit={ refresh } iconButton/>,

          update: checkAuthorization(ExamPermission.Update, exam) &&
            <AddExam exam={ exam } onSubmit={ refresh } iconButton/>,

          delete: checkAuthorization(ExamPermission.Delete, exam) &&
            <DeleteExam exam={ exam } onSubmit={ refresh } iconButton/>,

          examSession: canAddExamSession(exam) && <AddExamSession exam={ exam } iconButton/>,
        },
      ] }
    />
  </>
}

export default memo(Exams)