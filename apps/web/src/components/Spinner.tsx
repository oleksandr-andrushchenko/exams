import { Button, IconButton, Spinner as BootstrapSpinner } from '@/components/bootstrap'
import { ComponentProps, memo, ReactNode } from 'react'

interface Props extends ComponentProps<any> {
  type?: 'button' | 'icon-button' | 'text'
  height?: string
  width?: string
  children?: ReactNode
}

const Spinner = ({type, height, width, children}: Props) => {
  if (type === 'button') {
    return (
            <span className="placeholder-glow">
 <Button
         disabled
         tabIndex={-1}
         className={`${height ?? ''} ${width ?? 'w-100'}`} color="secondary"
 >
 {children ?? ''}
 </Button>
 </span>
    )
  }

  if (type === 'icon-button') {
    return (
            <span className="placeholder-glow">
 <IconButton disabled tabIndex={-1} color="secondary">
 &nbsp;
 </IconButton>
 </span>
    )
  }

  if (type === 'text') {
    return <span className="placeholder-glow d-inline-block w-100"><span className="placeholder col-6"/></span>
  }

  return <BootstrapSpinner/>
}

export default memo(Spinner)
