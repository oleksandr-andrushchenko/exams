import { Typography } from '@/components/bootstrap'
import { ComponentProps, createElement, memo } from 'react'
import Subtitle from './Subtitle'

interface Props extends ComponentProps<any> {
  icon?: any
  label?: any
  sub?: any
  children?: any
}

const H3 = ({icon, label, sub, children, ...props}: Props) => {
  const h3 = (
          <Typography as="h3" variant="h4" {...props}>
            {icon && createElement(icon, {className: ' d-inline-block'})}
            {icon && ' '}
            {label || children}
          </Typography>
  )

  if (sub) {
    return <>{h3} <Subtitle>{sub}</Subtitle></>
  }

  return h3
}

export default memo(H3)