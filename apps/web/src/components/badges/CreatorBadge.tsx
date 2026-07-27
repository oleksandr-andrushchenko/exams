import { ComponentProps, memo } from 'react'
import { Chip } from '@/components/bootstrap'

interface Props extends ComponentProps<any> {
  yes?: boolean
}

const CreatorBadge = ({yes = true}: Props) => {
  return yes ? <Chip value="Created by you" color="red" className="fw-normal"/> : ''
}

export default memo(CreatorBadge)