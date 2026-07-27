import { useField } from 'formik'
import Error from '../Error'
import { Input } from '@/components/bootstrap'
import { ComponentProps } from 'react'

interface Props extends ComponentProps<'input'> {
  name: string
  type?: any
  size?: any
  label?: string
  children?: any
}

export default function FormikInput({name, type = 'text', size = 'lg', label, children}: Props) {
  const [input, meta] = useField(name)
  const {touched, error} = meta
  const inputLabel = label || (Array.isArray(children) ? children.join('') : children) || name

  return (
          <div className="d-flex flex-column gap-1">
            <Input
                    {...input}
                    type={type}
                    size={size}
                    label={inputLabel}
                    placeholder={String(inputLabel)}
                    success={touched && !error}
                    error={touched && !!error}
            />

            {touched && error && <Error text={error}/>}
          </div>
  )
};