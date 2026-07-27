import { ComponentProps, memo, useState } from 'react'
import Exam from '../../schema/exam/Exam'
import { DisabledIcon, EnabledIcon } from '../../registry/icons'
import toggleExamApprove from '../../client/graphql/exam/toggleExamApprove'
import IconButton from '../elements/IconButton'
import Button from '../elements/Button'
import { apiMutate } from '../../client/graphql/apolloClient'
import Error from '../Error'
import YesNo from '../elements/YesNo'

interface Props extends ComponentProps<any> {
  exam: Exam
  onChange?: Function
  iconButton?: boolean
  readonly?: boolean
}

const _ApproveExam = ({exam, onChange, iconButton = false, readonly = false}: Props) => {
  const [isApproved, setApproved] = useState<boolean>(exam.isApproved!)
  const [isSubmitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string>('')

  if (readonly) {
    return (
            <YesNo yes={isApproved}/>
    )
  }

  const icon = isApproved ? EnabledIcon : DisabledIcon
  const label = isApproved
          ? (isSubmitting ? 'Un-approving Exam...' : 'Un-approve Exam')
          : (isSubmitting ? 'Approving Exam...' : 'Approve Exam')

  const onClick = () => {
    apiMutate(
            // todo: change depending on onChange is defined or not
            toggleExamApprove(exam.id!),
            (data: { toggleExamApprove: Exam }) => {
              const updatedExam = data.toggleExamApprove
              setApproved(updatedExam.isApproved!)
              onChange && onChange(updatedExam)
            },
            setError,
            setSubmitting,
    )
  }

  return (
          <>
            {error && <Error text={error} simple/>}
            {iconButton
                    ? <IconButton icon={icon} tooltip={label} onClick={onClick} disabled={isSubmitting}/>
                    : <Button icon={icon} label={label} onClick={onClick} disabled={isSubmitting}/>}
          </>
  )
}

export const ApproveExam = memo(_ApproveExam)