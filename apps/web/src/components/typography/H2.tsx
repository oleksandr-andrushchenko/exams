import { Typography } from '@/components/bootstrap'
import { ComponentProps, createElement, memo } from 'react'

interface Props extends ComponentProps<any> {
  icon?: any
  label?: any
  children?: any
}

const H2 = ({icon, label, children, ...props}: Props) => {
  return <Typography as="h2" variant="h6"  {...props}>
    {icon && createElement(icon, {className: ' d-inline-block'})}
    {icon && ' '}
    {label || children}
  </Typography>
}

export default memo(H2)