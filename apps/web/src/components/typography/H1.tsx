import { Typography } from '@/components/bootstrap'
import { ComponentProps, createElement, memo } from 'react'
import Subtitle from './Subtitle'

interface Props extends ComponentProps<any> {
  icon?: any
  label?: any
  sub?: any
  sup?: any
  children?: any
}

const H1 = ({icon, label, sub, sup, children, ...props}: Props) => {
  const h1 = (
          <Typography as="h1" variant="h2"  {...props}>
            {icon && createElement(icon, {className: ' d-inline-block'})}
            {icon && ' '}
            {label || children}
            {sup && ' '}
            {sup && <sup>{sup}</sup>}
          </Typography>
  )

  if (sub) {
    return <>{h1} <Subtitle>{sub}</Subtitle></>
  }

  return h1
}

export default memo(H1)