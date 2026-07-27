import { Button as MlButton, Tooltip } from '@/components/bootstrap'
import { ComponentPropsWithoutRef, createElement, memo } from 'react'

interface Props extends ComponentPropsWithoutRef<'button'> {
  label?: string
  tooltip?: string
  size?: any
  className?: string
  icon?: any
  disabled?: boolean
  type?: any
  variant?: any
  color?: any
  children?: any
  key?: any
}

const Button = (
        {
          label,
          tooltip,
          size,
          className,
          icon,
          onClick,
          disabled,
          type,
          variant,
          color,
          children,
          ...props
        }: Props,
) => {
  const button = (
          <MlButton
                  {...props}
                  variant={variant}
                  color={color}
                  size={size}
                  type={type}
                  className={className}
                  onClick={onClick}
                  disabled={disabled}
          >
            {icon && createElement(icon, {className: 'd-inline-block  align-top'})}
            {icon && ' '}
            {label || children}
          </MlButton>
  )

  if (tooltip) {
    return (
            <Tooltip content={tooltip}>
              {disabled ? <div>{button}</div> : button}
            </Tooltip>
    )
  }

  return button
}

export default memo(Button)