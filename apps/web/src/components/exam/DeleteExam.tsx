import { ComponentProps, memo } from 'react'
import Exam from '../../schema/exam/Exam'
import deleteExam from '../../client/graphql/exam/deleteExam'
import { DeleteIcon } from '../../registry/icons'
import ConfirmDialog from '../dialogs/ConfirmDialog'

interface Props extends ComponentProps<any> {
  exam: Exam
  onSubmit?: (data: any) => void
  iconButton?: boolean
}

const DeleteExam = ({ exam, onSubmit, iconButton = false }: Props) => {
  return (
    <ConfirmDialog
      mutateOptionsFn={ () => deleteExam(exam.id!) }
      iconFn={ DeleteIcon }
      labelFn={ (isSubmitting) => isSubmitting ? 'Deleting Exam...' : 'Delete Exam' }
      title={ `Are you sure you want to delete "${ exam.name }" exam?` }
      body={ <>This will delete "{ exam.name }" exam and all its questions [ { exam.questionCount ?? 0 } ]
        permanently.<br/>You cannot undo this action.</> }
      onSubmit={ onSubmit }
      iconButton={ iconButton }
    />
  )
}

export default memo(DeleteExam)