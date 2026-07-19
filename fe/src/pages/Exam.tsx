import { useNavigate, useParams } from 'react-router-dom'
import { Breadcrumbs } from '@material-tailwind/react'
import Route from '../enum/Route'
import { HomeIcon } from '@heroicons/react/24/solid'
import { memo, useEffect, useState } from 'react'
import useAuth from '../hooks/useAuth'
import Spinner from '../components/Spinner'
import Exam from '../schema/exam/Exam'
import Question from '../schema/question/Question'
import DeleteExam from '../components/exam/DeleteExam'
import AddQuestion from '../components/question/AddQuestion'
import AddExam from '../components/exam/AddExam'
import DeleteQuestion from '../components/question/DeleteQuestion'
import { QuestionDifficulty, QuestionType } from '../schema/question/CreateQuestion'
import AddExamSession from '../components/examSession/AddExamSession'
import { apiQuery } from '../api/apolloClient'
import getExamForExamPage from '../api/exam/getExamForExamPage'
import Error from '../components/Error'
import ExamPermission from '../enum/exam/ExamPermission'
import QuestionPermission from '../enum/question/QuestionPermission'
import Paginated from '../schema/pagination/Paginated'
import Table from '../components/elements/Table'
import getQuestionsForExamPage from '../api/exam/getQuestionsForExamPage'
import Link from '../components/elements/Link'
import H1 from '../components/typography/H1'
import InfoTable from '../components/elements/InfoTable'
import createListFromEnum from '../utils/createListFromEnum'
import { ApproveQuestion } from '../components/question/ApproveQuestion'
import { ApproveExam } from '../components/exam/ApproveExam'
import { default as YesNoEnum } from '../enum/YesNo'
import canAddExamSession from '../services/examSessions/canAddExamSession'
import ExamTags from '../components/examTag/ExamTags'
import CreatorBadge from '../components/badges/CreatorBadge'
import { RateQuestion } from '../components/question/RateQuestion'
import { RateExam } from '../components/exam/RateExam'
import { Params } from '@remix-run/router/utils'
import GetQuestions from '../schema/question/GetQuestions'
import Buttons from '../components/elements/Buttons'

const Exam = () => {
  const [ tableKey, setTableKey ] = useState<number>(1)
  const [ infoTableKey, setInfoTableKey ] = useState<number>(1)
  const { authenticationToken, checkAuthorization } = useAuth()
  const { examId } = useParams<Params>() as { examId: string }
  const [ exam, setExam ] = useState<Exam>()
  const [ _, setLoading ] = useState<boolean>(true)
  const [ error, setError ] = useState<string>('')
  const navigate = useNavigate()

  const updateExam = (exam: Exam) => setExam(exam)
  const refreshExam = () => apiQuery(
    getExamForExamPage(examId),
    (data: { exam: Exam }) => setExam(data.exam),
    setError,
    setLoading,
  )
  const refreshTable = () => {
    setTableKey(Math.random())
  }
  const refreshInfoTable = () => {
    setInfoTableKey(Math.random())
  }
  const updateExamAndRefreshInfoTable = (exam: Exam) => {
    updateExam(exam)
    refreshInfoTable()
  }
  const onDelete = () => navigate(Route.Exams, { replace: true })

  const refreshExamAndTable = () => {
    refreshExam()
    refreshTable()
  }

  useEffect(() => {
    refreshExamAndTable()
  }, [ authenticationToken ])

  useEffect(() => {
    document.title = exam?.name || 'ExamMe'
  }, [ exam ])

  return <>
    <Breadcrumbs>
      <Link icon={ HomeIcon } label="Home" to={ Route.Home }/>
      <Link label="Exams" to={ Route.Exams }/>
      { !exam ? <Spinner type="text"/> :
        <Link label={ exam.name } to={ Route.Exam.replace(':examId', exam.id!) }/> }
    </Breadcrumbs>

    <H1
      label={ exam?.name ?? <Spinner type="text"/> }
      sup={ exam?.isCreator ? <CreatorBadge/> : '' }
    />

    { exam
      ? <RateExam
        exam={ exam }
        onChange={ updateExam }
        readonly={ !checkAuthorization(ExamPermission.Rate) }
        showAverageMark
        showMarkCount
      /> : <Spinner type="text"/> }

    { error && <Error text={ error }/> }

    <Buttons
      className="mt-2"
      buttons={ {
        create: !exam ? <Spinner type="button"/> :
          <AddQuestion exam={ exam } onSubmit={ refreshExamAndTable }/>,

        approve: !exam ? <Spinner type="button"/> : (checkAuthorization(ExamPermission.Approve) &&
          <ApproveExam exam={ exam } onChange={ updateExamAndRefreshInfoTable }/>),

        update: checkAuthorization(ExamPermission.Update, exam) && (!exam ? <Spinner type="button"/> :
          <AddExam exam={ exam } onSubmit={ updateExam }/>),

        delete: checkAuthorization(ExamPermission.Delete, exam) && (!exam ? <Spinner type="button"/> :
          <DeleteExam exam={ exam } onSubmit={ onDelete }/>),

        examSession: !exam ? <Spinner type="button"/> : canAddExamSession(exam) && <AddExamSession exam={ exam }/>,
      } }
    />

    <InfoTable
      className="mt-4"
      title="Exam info"
      key2={ infoTableKey }
      source={ exam }
      columns={ [ 'Name', 'Tags', 'Questions', 'Required score', 'Rating', 'Approved' ] }
      mapper={ (exam: Exam) => [
        exam.name,
        <ExamTags tags={ exam.tags }/>,
        `${ exam.approvedQuestionCount ?? 0 }/${ exam.questionCount ?? 0 }`,
        exam.requiredScore ?? 0,
        <RateExam exam={ exam } readonly/>,
        <ApproveExam exam={ exam } readonly/>,
      ] }
    />

    <Table
      key2={ tableKey }
      tabs={ {
        // subscription: Object.values(YesNoEnum),
        approved: Object.values(YesNoEnum),
        // creator: authenticationToken ? Object.values(Creator) : '',
      } }
      filters={ {
        difficulty: createListFromEnum(QuestionDifficulty),
      } }
      columns={ [ '#', 'Title', 'Choices', 'Difficulty', 'Approved', 'Rating', '' ] }
      queryOptions={ (filter: GetQuestions) => getQuestionsForExamPage(examId, filter) }
      queryData={ (data: { paginatedQuestions: Paginated<Question> }) => data.paginatedQuestions }
      mapper={ (question: Question, index: number) => [
        question.id,
        index + 1,
        <Link
          label={ question.title }
          sup={ question.isCreator ? <CreatorBadge/> : '' }
          tooltip={ question.title }
          to={ Route.Question.replace(':examId', question.examId!).replace(':questionId', question.id!) }
        />,
        question.type === QuestionType.CHOICE ? (question.choices || []).length : 'N/A',
        question.difficulty,
        <ApproveQuestion
          question={ question }
          readonly={ !checkAuthorization(QuestionPermission.Approve) }
          onChange={ refreshExam }
          iconButton
        />,
        <RateQuestion
          question={ question }
          readonly={ !checkAuthorization(QuestionPermission.Rate) }
        />,
        {
          update: checkAuthorization(QuestionPermission.Update, question) &&
            <AddQuestion question={ question } onSubmit={ refreshExamAndTable } iconButton/>,

          delete: checkAuthorization(QuestionPermission.Delete, question) &&
            <DeleteQuestion question={ question } onSubmit={ refreshExamAndTable } iconButton/>,
        },
      ] }
    />
  </>
}

export default memo(Exam)