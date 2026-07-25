import { Params, useNavigate, useParams } from 'react-router-dom'
import { Breadcrumbs, ButtonGroup, Checkbox, Input, Progress } from '@material-tailwind/react'
import Route from '../enum/Route'
import { ArrowLeftIcon, ArrowRightIcon, HomeIcon } from '@heroicons/react/24/solid'
import { memo, ReactNode, useEffect, useState } from 'react'
import useAuth from '../hooks/useAuth'
import Spinner from '../components/Spinner'
import ExamSessionPermission from '../enum/examSession/ExamSessionPermission'
import DeleteExamSession from '../components/examSession/DeleteExamSession'
import ExamSessionQuestion from '../schema/examSession/ExamSessionQuestion'
import { QuestionType } from '../schema/question/CreateQuestion'
import CompleteExamSession from '../components/examSession/CompleteExamSession'
import { apiMutate, apiQuery } from '../client/graphql/apolloClient'
import createExamSessionQuestionAnswer from '../client/graphql/examSession/createExamSessionQuestionAnswer'
import getExamSessionQuestion from '../client/graphql/examSession/getExamSessionQuestion'
import getCurrentExamSessionQuestion from '../client/graphql/examSession/getCurrentExamSessionQuestion'
import deleteExamSessionQuestionAnswer from '../client/graphql/examSession/deleteExamSessionQuestionAnswer'
import Error from '../components/Error'
import Unauthenticated from './Unauthenticated'
import Unauthorized from './Unauthorized'
import ExamSession from '../schema/examSession/ExamSession'
import H1 from '../components/typography/H1'
import Link from '../components/elements/Link'
import H2 from '../components/typography/H2'
import Button from '../components/elements/Button'
import InfoTable from '../components/elements/InfoTable'
import YesNo from '../components/elements/YesNo'

const ExamSession = () => {
  const { examSessionId } = useParams<Params>() as { examSessionId: string }
  const [ questionNumber, setQuestionNumber ] = useState<number>()
  const [ examSessionQuestion, setExamSessionQuestion ] = useState<ExamSessionQuestion>()
  const [ answering, setAnswering ] = useState<boolean>(false)
  const [ clearing, setClearing ] = useState<boolean>(false)
  const [ _, setLoading ] = useState<boolean>(true)
  const [ error, setError ] = useState<string>('')
  const { authenticationToken, me, checkAuthorization } = useAuth()
  const navigate = useNavigate()
  const examSession = examSessionQuestion?.examSession
  const exam = examSession?.exam

  const onPrevQuestionClick = () => setQuestionNumber(getQuestionNumber() - 1)
  const onNextQuestionClick = () => setQuestionNumber(getQuestionNumber() + 1)
  const onCompleted = (data: { createExamSessionCompletion: ExamSession }) => setExamSessionQuestion({
    ...examSessionQuestion,
    ...{ examSession: data.createExamSessionCompletion },
  })
  const onDeleted = () => navigate(Route.Exam.replace(':examId', examSessionQuestion!.examSession!.examId!), { replace: true })

  const getQuestionNumber = (): number => {
    if (questionNumber !== undefined) {
      return questionNumber
    }

    if (examSessionQuestion === undefined) {
      return 0
    }

    return examSessionQuestion.number ?? 0
  }
  const showPrev = (): boolean => {
    if (answering || clearing) {
      return false
    }

    const questionNumber = getQuestionNumber()


    return questionNumber > 0
  }
  const showNext = (): boolean => {
    if (answering || clearing) {
      return false
    }

    const questionNumber = getQuestionNumber()


    return questionNumber < (examSessionQuestion?.examSession?.questionCount ?? 0) - 1
  }

  const createAnswer = (answer: number | string) => {
    const transfer = examSessionQuestion!.question!.type === QuestionType.CHOICE
      ? { choice: answer as number }
      : { answer: answer as string }

    apiMutate(
      createExamSessionQuestionAnswer(examSessionId, getQuestionNumber()!, transfer),
      (data: { createExamSessionQuestionAnswer: ExamSessionQuestion }) => setExamSessionQuestion(data.createExamSessionQuestionAnswer),
      setError,
      setAnswering,
    )
  }

  const clearAnswer = () => {
    apiMutate(
      deleteExamSessionQuestionAnswer(examSessionId, getQuestionNumber()!),
      (data: { deleteExamSessionQuestionAnswer: ExamSessionQuestion }) => setExamSessionQuestion(data.deleteExamSessionQuestionAnswer),
      setError,
      setClearing,
    )
  }

  useEffect(() => {
    if (questionNumber === undefined) {
      apiQuery(
        getCurrentExamSessionQuestion(examSessionId),
        (data: { currentExamSessionQuestion: ExamSessionQuestion }) => setExamSessionQuestion(data.currentExamSessionQuestion),
        setError,
        setLoading,
      )
    } else {
      apiQuery(
        getExamSessionQuestion(examSessionId, questionNumber!),
        (data: { examSessionQuestion: ExamSessionQuestion }) => setExamSessionQuestion(data.examSessionQuestion),
        setError,
        setLoading,
      )
    }
  }, [ questionNumber ])

  useEffect(() => {
    document.title = `ExamSession: ${ examSessionQuestion?.examSession?.exam?.name || 'ExamMe' }`
  }, [ examSessionQuestion?.examSession?.exam?.name ])

  if (!authenticationToken) {
    return <Unauthenticated/>
  }

  if (!me) {
    return <Spinner/>
  }

  if (examSessionQuestion && !checkAuthorization(ExamSessionPermission.Get, examSessionQuestion?.examSession)) {
    return <Unauthorized/>
  }

  const layout = (header: string, body: ReactNode) => {
    return <>
      <Breadcrumbs>
        <Link icon={ HomeIcon } label="Home" to={ Route.Home }/>
        <Link label="Exams" to={ Route.Exams }/>
        { !examSessionQuestion ? <Spinner type="text"/> : <Link label={ examSessionQuestion.examSession!.exam!.name }
                                                         to={ Route.Exam.replace(':examId', examSessionQuestion.examSession!.examId!) }/> }
        <Link label="ExamSession" to={ Route.ExamSession.replace(':examSessionId', examSessionId) }/>
      </Breadcrumbs>

      <H1 sub={ header }>ExamSession: { examSessionQuestion ? examSessionQuestion.examSession!.exam!.name : <Spinner type="text"/> }</H1>

      { error && <Error text={ error }/> }

      { body }
    </>
  }

  if (examSession?.completedAt) {
    const score = Math.floor(100 * (examSession.correctAnswerCount ?? 0) / (examSession.questionCount ?? 1))
    const requiredScore = exam?.requiredScore ?? 0
    const passed = score > requiredScore

    return layout('ExamSession completed', (
      <InfoTable
        columns={ [ 'Completion date', 'Correct answers', 'Required score', 'Passed' ] }
        source={ examSession }
        mapper={ (examSession: ExamSession) => [
          new Date(examSession.completedAt!).toDateString(),
          <>{ examSession.correctAnswerCount }/{ examSession?.questionCount } ({ score }%)</>,
          <>{ requiredScore }%</>,
          <YesNo yes={ passed }/>,
        ] }
      />
    ))
  }

  return layout('ExamSession questions', <>
    { !examSessionQuestion ? <Spinner type="text" height="h-3"/> :
      <Progress
        value={ Math.floor(100 * (getQuestionNumber() + 1) / (examSessionQuestion.examSession?.questionCount ?? 1)) }
        label="Steps"
        size="sm"
        className="mt-4"
      /> }

    { !examSessionQuestion ? <Spinner type="text" height="h-4"/> :
      <Progress
        value={ Math.floor(100 * (examSessionQuestion.examSession?.answeredQuestionCount ?? 0) / (examSessionQuestion.examSession?.questionCount ?? 1)) }
        label="Answered"
        size="lg"
        className="mt-4"
      /> }

    { !examSessionQuestion ? <Spinner type="text"/> :
      <H2 className="min-h-8">Question #{ getQuestionNumber() + 1 }: { examSessionQuestion.question!.title }</H2> }

    <div className="flex flex-col gap-2 mt-4 min-h-48">
      { !examSessionQuestion ? <Spinner/> : (
        examSessionQuestion.question!.type === QuestionType.CHOICE
          ? examSessionQuestion!.choices!.map((choice: string, index) => (
            <Checkbox
              key={ `${ examSessionQuestion.question!.id }-${ index }-${ examSessionQuestion.choice }` }
              name="choice"
              defaultChecked={ index === examSessionQuestion.choice }
              onChange={ (e) => e.target.checked ? createAnswer(index) : clearAnswer() }
              label={ choice }
              disabled={ answering }
            />
          ))
          : <Input
            type="text"
            name="answer"
            size="lg"
            label="Answer"
            onChange={ (e) => createAnswer(e.target.value) }
            disabled={ answering }
          />
      ) }
    </div>

    <div className="flex gap-1 items-center mt-4">
      { examSessionQuestion &&
        <ButtonGroup variant="outlined">
          <Button icon={ ArrowLeftIcon } label="Prev" onClick={ onPrevQuestionClick } disabled={ !showPrev() }/>
          <Button icon={ ArrowRightIcon } label="Next" onClick={ onNextQuestionClick } disabled={ !showNext() }/>
        </ButtonGroup> }

      { examSessionQuestion && checkAuthorization(ExamSessionPermission.CreateCompletion, examSessionQuestion.examSession) &&
        <CompleteExamSession examSession={ examSessionQuestion.examSession! } onSubmit={ onCompleted }/> }

      { examSessionQuestion && checkAuthorization(ExamSessionPermission.Delete, examSessionQuestion.examSession) &&
        <DeleteExamSession examSession={ examSessionQuestion.examSession! } onSubmit={ onDeleted }/> }
    </div>
  </>)
}

export default memo(ExamSession)