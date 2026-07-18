import { ComponentProps, memo } from 'react'
import ExamSession from '../../schema/examSession/ExamSession'
import deleteExamSession from '../../api/examSession/deleteExamSession'
import { DeleteIcon } from '../../registry/icons'
import ConfirmDialog from '../dialogs/ConfirmDialog'

interface Props extends ComponentProps<any> {
  examSession: ExamSession
  onSubmit?: (data: any) => void
  iconButton?: boolean
}

const DeleteExamSession = ({ examSession, onSubmit, iconButton = false }: Props) => {
  return (
    <ConfirmDialog
      mutateOptionsFn={ () => deleteExamSession(examSession.id!) }
      iconFn={ DeleteIcon }
      labelFn={ (isSubmitting) => isSubmitting ? 'Deleting ExamSession...' : 'Delete ExamSession' }
      title={ `Are you sure you want to delete "${ examSession.exam!.name }" examSession?` }
      body={ <>This will delete "{ examSession.exam!.name }" examSession permanently.<br/>You cannot undo this action.</> }
      onSubmit={ onSubmit }
      iconButton={ iconButton }
    />
  )
}

export default memo(DeleteExamSession)