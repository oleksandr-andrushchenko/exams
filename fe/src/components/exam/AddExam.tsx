import { Card, CardBody, Dialog } from '@material-tailwind/react'
import { ComponentProps, memo, useState } from 'react'
import Exam from '../../schema/exam/Exam'
import { apiMutate } from '../../api/apolloClient'
import updateExam from '../../api/exam/updateExam'
import createExam from '../../api/exam/createExam'
import Error from '../Error'
import { Form, Formik, FormikHelpers } from 'formik'
import * as yup from 'yup'
import FormikTextarea from '../formik/FormikTextarea'
import FormikInput from '../formik/FormikInput'
import { CreateIcon, EditIcon } from '../../registry/icons'
import IconButton from '../elements/IconButton'
import Button from '../elements/Button'
import useAuth from '../../hooks/useAuth'
import Auth from '../Auth'
import ExamPermission from '../../enum/exam/ExamPermission'
import H3 from '../typography/H3'

interface Props extends ComponentProps<any> {
  exam?: Exam
  onSubmit?: (question: Exam) => void
  iconButton?: boolean
}

interface Form {
  name: string
  requiredScore: number
}

const AddExam = ({ exam, onSubmit, iconButton = false }: Props) => {
  const [ open, setOpen ] = useState<boolean>(false)
  const handleOpen = () => setOpen(!open)
  const [ error, setError ] = useState<string>('')
  const { authenticationToken, checkAuthorization } = useAuth()

  const icon = exam ? EditIcon : CreateIcon
  const label = exam ? 'Update Exam' : 'Add Exam'

  if (!authenticationToken) {
    return <Auth
      button={ { icon, label, size: 'sm', iconOnly: iconButton } }
      dialog={ { label: 'You need to be authenticated' } }
      onSubmit={ () => setOpen(true) }
    />
  }

  const buildButton = (props = {}) => {
    if (iconButton) {
      return <IconButton icon={ icon } tooltip={ label } onClick={ handleOpen } { ...props }/>
    }

    return <Button icon={ icon } label={ label } onClick={ handleOpen } { ...props }/>
  }

  const permission = exam ? ExamPermission.Update : ExamPermission.Create

  if (!checkAuthorization(permission, exam)) {
    return buildButton({ disabled: true, tooltip: 'You are not allowed to do this' })
  }

  return <>
    { buildButton() }
    <Dialog open={ open } handler={ handleOpen } className="text-left">
      <Card>
        <CardBody className="flex flex-col gap-4">
          <H3 icon={ icon } label={ label }/>
          <Formik
            initialValues={ {
              name: exam?.name || '',
              requiredScore: exam?.requiredScore || 0,
            } }
            validationSchema={ yup.object({
              name: yup.string()
                .min(3, 'Name must be at least 3 characters')
                .max(100, 'Name cannot exceed 100 characters')
                .matches(/^[a-zA-Z]/, 'Name must start with a letter')
                .required('Name is required'),
              requiredScore: yup.number()
                .min(0, 'Score must be at least 0')
                .max(100, 'Score cannot exceed 100')
                .optional(),
            }) }
            onSubmit={ (values, { setSubmitting }: FormikHelpers<Form>) => {
              setError('')

              const transfer = {
                name: values.name,
                requiredScore: values.requiredScore,
              }
              const callback = (exam: Exam) => {
                setOpen(false)
                onSubmit && onSubmit(exam)
              }

              if (exam) {
                apiMutate(
                  updateExam(exam.id!, transfer),
                  (data: { updateExam: Exam }) => callback(data.updateExam),
                  setError,
                  setSubmitting,
                )
              } else {
                apiMutate(
                  createExam(transfer),
                  (data: { createExam: Exam }) => callback(data.createExam),
                  setError,
                  setSubmitting,
                )
              }
            } }>
            { ({ isSubmitting }) => (
              <Form className="flex flex-col gap-6">

                <FormikTextarea name="name" label="Name"/>
                <FormikInput name="requiredScore" type="number" label="Required score"/>

                { error && <Error text={ error }/> }

                <div>
                  <Button label="Cancel" type="reset" onClick={ handleOpen }/>{ ' ' }
                  <Button
                    icon={ icon }
                    label={ exam ? (isSubmitting ? 'Updating...' : 'Update') : (isSubmitting ? 'Adding...' : 'Add') }
                    size="md"
                    type="submit"
                    disabled={ isSubmitting }
                  />
                </div>
              </Form>
            ) }
          </Formik>
        </CardBody>
      </Card>
    </Dialog>
  </>
}

export default memo(AddExam)
