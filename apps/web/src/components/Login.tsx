import { Button, Typography } from '@/components/bootstrap'
import { ComponentProps, memo, ReactNode, useState } from 'react'
import useAuth from '../hooks/useAuth'
import { apiMutate } from '../client/graphql/apolloClient'
import Error from './Error'
import { Form, Formik, FormikHelpers } from 'formik'
import * as yup from 'yup'
import FormikInput from './formik/FormikInput'
import Token from '../schema/auth/Token'
import createAuthenticationToken from '../client/graphql/authenticate/createAuthenticationToken'
import { Link } from 'react-router-dom'
import Route from '../enum/Route'

interface Props extends ComponentProps<any> {
  onSubmit?: () => void
  buttons?: ReactNode
  onRegisterClick?: () => void
}

interface Form {
  email: string
  password: string
}

const Login = ({onSubmit, buttons, onRegisterClick}: Props) => {
  const [error, setError] = useState<string>('')
  const {setAuthenticationToken} = useAuth()

  return (
          <Formik
                  initialValues={{
                    email: '',
                    password: '',
                  }}
                  validationSchema={yup.object({
                    email: yup.string()
                            .email('Invalid email address')
                            .required('Email is required'),
                    password: yup.string()
                            .min(8, 'Password must be at least 8 characters')
                            .max(24, 'Password cannot exceed 24 characters')
                            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[~!@#$%^&*()])/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
                            .required('Password is required'),
                  })}
                  onSubmit={(values, {setSubmitting}: FormikHelpers<Form>) => {
                    setError('')

                    const transfer = {
                      email: values.email,
                      password: values.password,
                    }
                    apiMutate(
                            createAuthenticationToken(transfer),
                            (data: { createAuthenticationToken: Token }) => {
                              setAuthenticationToken(data.createAuthenticationToken)
                              onSubmit && onSubmit()
                            },
                            setError,
                            setSubmitting,
                    )
                  }}>
            {({isSubmitting, isValid, dirty}) => (
                    <Form className="d-flex flex-column gap-5">
                      <Typography variant="h4" color="blue-gray">Login</Typography>

                      <FormikInput name="email" type="email" label="Email Address"/>
                      <FormikInput name="password" type="password" label="Password"/>

                      {error && <Error text={error}/>}

                      <div>
                        {buttons}

                        <Button type="submit" className="ms-1" size="md" disabled={isSubmitting || !dirty || !isValid}>
                          {isSubmitting ? 'Logging in...' : 'Login'}
                        </Button>

                        <Typography variant="small" color="gray" className="mt-4 fw-normal">
                          Don't have an account?
                          {onRegisterClick
                                  ? <Button variant="text" className="fw-medium text-secondary"
                                            onClick={onRegisterClick}>Register</Button>
                                  : <Link className="fw-medium text-secondary" to={Route.Register}>Register</Link>}
                        </Typography>
                      </div>
                    </Form>
            )}
          </Formik>
  )
}

export default memo(Login)
