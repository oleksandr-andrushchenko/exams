import { Typography } from '@/components/bootstrap'
import { ComponentProps, memo } from 'react'

interface Props extends ComponentProps<any> {
  label?: any
  children?: any
}

const Subtitle = ({label, children, ...props}: Props) => {
  return <Typography variant="small" {...props}>
    {label || children}
  </Typography>
}

export default memo(Subtitle)