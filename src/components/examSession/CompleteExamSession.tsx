import { CheckIcon } from '@heroicons/react/24/solid'
import { ComponentProps, memo } from 'react'
import ExamSession from '../../schema/examSession/ExamSession'
import createExamSessionCompletion from '../../client/graphql/examSession/createExamSessionCompletion'
import ConfirmDialog from '../dialogs/ConfirmDialog'

interface Props extends ComponentProps<any> {
  examSession: ExamSession
  onSubmit?: (data: any) => void
  iconButton?: boolean
}

const CompleteExamSession = ({ examSession, onSubmit, iconButton = false }: Props) => {
  return (
    <ConfirmDialog
      mutateOptionsFn={ () => createExamSessionCompletion(examSession.id!) }
      iconFn={ CheckIcon }
      labelFn={ (isSubmitting) => isSubmitting ? 'Completing ExamSession...' : 'Complete ExamSession' }
      title={ `Are you sure you want to complete "${ examSession.exam!.name }" examSession?` }
      body={ <>This will complete "{ examSession.exam!.name }" examSession permanently.<br/>You cannot undo this action.</> }
      onSubmit={ onSubmit }
      iconButton={ iconButton }
    />
  )
}

export default memo(CompleteExamSession)