import { ComponentProps, memo } from 'react'
import Question from '../../schema/question/Question'
import deleteQuestion from '../../client/graphql/question/deleteQuestion'
import { DeleteIcon } from '../../registry/icons'
import ConfirmDialog from '../dialogs/ConfirmDialog'

interface Props extends ComponentProps<any> {
  question: Question
  onSubmit?: (data: any) => void
  iconButton?: boolean
}

const DeleteQuestion = ({ question, onSubmit, iconButton = false }: Props) => {
  return (
    <ConfirmDialog
      mutateOptionsFn={ () => deleteQuestion(question.id!) }
      iconFn={ DeleteIcon }
      labelFn={ (isSubmitting) => isSubmitting ? 'Deleting Question...' : 'Delete Question' }
      title={ `Are you sure you want to delete "${ question.title }" question?` }
      body={ <>This will delete "{ question.title }" question permanently.<br/>You cannot undo this action.</> }
      onSubmit={ onSubmit }
      iconButton={ iconButton }
    />
  )
}

export default memo(DeleteQuestion)