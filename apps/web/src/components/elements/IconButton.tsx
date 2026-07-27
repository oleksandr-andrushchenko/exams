import { IconButton as MlIconButton, Tooltip } from '@/components/bootstrap'
import { ComponentPropsWithoutRef, createElement, memo } from 'react'

interface Props extends ComponentPropsWithoutRef<'button'> {
  icon?: any
  tooltip?: any
  size?: any
  className?: string
  disabled?: boolean
  type?: any
  variant?: any
  color?: any
  key?: any
}

const IconButton = (
        {
          icon,
          tooltip,
          size,
          className,
          onClick,
          disabled,
          type,
          variant,
          color,
          ...props
        }: Props,
) => {
  const button = (
          <MlIconButton
                  {...props}
                  variant={variant}
                  color={color}
                  size={size}
                  type={type}
                  className={className}
                  onClick={onClick}
                  disabled={disabled}
          >
            {createElement(icon, {className: ' align-top'})}
          </MlIconButton>
  )

  if (tooltip) {
    return (
            <Tooltip content={tooltip}>{button}</Tooltip>
    )
  }

  return button
}

export default memo(IconButton)