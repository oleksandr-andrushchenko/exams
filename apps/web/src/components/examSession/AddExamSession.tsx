import { PlayIcon } from '@heroicons/react/24/solid'
import { ComponentProps, memo, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Route from '../../enum/Route'
import Exam from '../../schema/exam/Exam'
import ExamSession from '../../schema/examSession/ExamSession'
import useAuth from '../../hooks/useAuth'
import { apiMutate } from '../../client/graphql/apolloClient'
import createExamSession from '../../client/graphql/examSession/createExamSession'
import Error from '../Error'
import Link from '../elements/Link'
import IconButton from '../elements/IconButton'
import Button from '../elements/Button'
import Auth from '../Auth'

interface Props extends ComponentProps<any> {
  exam: Exam
  iconButton?: boolean
}

const AddExamSession = ({ exam, iconButton = false }: Props) => {
  const { authenticationToken } = useAuth()
  const [ processing, setProcessing ] = useState<boolean>(false)
  const [ create, setCreate ] = useState<boolean>(false)
  const [ error, setError ] = useState<string>('')
  const navigate = useNavigate()

  useEffect(() => {
    if (create) {
      apiMutate(
        createExamSession({ examId: exam.id! }),
        (data: {
          createExamSession: ExamSession
        }) => navigate(Route.ExamSession.replace(':examId', exam.id!).replace(':examSessionId', data.createExamSession.id!)),
        setError,
        setProcessing,
      )
    }
  }, [ create ])

  const onClick = () => setCreate(true)

  const icon = PlayIcon
  const label = 'Start examSession'
  const color = 'indigo'

  if (!authenticationToken) {
    return <Auth
      button={ { icon, label, size: 'sm', iconOnly: iconButton!, color } }
      dialog={ { label: 'You need to be authenticated' } }
      onSubmit={ onClick }
    />
  }

  if (exam.examSessionId) {
    const url = Route.ExamSession.replace(':examId', exam.id!).replace(':examSessionId', exam.examSessionId)
    const label = 'Continue examSession'
    const color = 'blue'

    if (iconButton) {
      return <Link to={ url } label={ <IconButton icon={ icon } color={ color }/> } tooltip={ label }/>
    }

    return <Link to={ url } label={ <Button icon={ icon } label={ label } color={ color }/> }/>
  }

  return <>
    { error && <Error text={ error }/> }

    { iconButton
      ? <IconButton icon={ icon } tooltip={ label } color={ color } onClick={ onClick } disabled={ processing }/>
      : <Button icon={ icon } label={ label } color={ color } onClick={ onClick } disabled={ processing }/> }
  </>
}

export default memo(AddExamSession)