import { useField } from 'formik'
import Error from '../Error'
import { Checkbox, Typography } from '@/components/bootstrap'
import { ComponentProps } from 'react'

interface Props extends ComponentProps<any> {
  name: string
  label?: string
  children?: any
}

export default function FormikCheckbox({name, label, children}: Props) {
  const [input, meta] = useField(name)
  const {touched, error} = meta

  return (
          <div className="d-flex flex-column gap-1">
            <Checkbox
                    {...input}
                    name={name}
                    defaultChecked={input.value}
                    label={label || (
                            <Typography
                                    variant="small"
                                    color="gray"
                                    className="d-flex align-items-center fw-normal"
                            >
                              {children}
                            </Typography>
                    )}
            />

            {touched && error && <Error text={error}/>}
          </div>
  )
};