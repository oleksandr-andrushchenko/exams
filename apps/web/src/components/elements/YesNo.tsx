import { ComponentProps, memo } from 'react'
import { Chip } from '@/components/bootstrap'

interface Props extends ComponentProps<any> {
  yes?: boolean
}

const YesNo = ({yes}: Props) => {
  return yes ? <Chip value="Yes" color="green"/> : <Chip value="No" color="orange"/>
}

export default memo(YesNo)