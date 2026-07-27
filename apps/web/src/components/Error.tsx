import { ExclamationCircleIcon } from '@heroicons/react/24/solid'
import { Typography } from '@/components/bootstrap'
import { ComponentProps, memo } from 'react'
import Text from './typography/Text'

interface Props extends ComponentProps<any> {
  text: string
  simple?: boolean
}

const Error = ({text, simple}: Props) => {
  console.log(text)

  if (simple) {
    return (
            <Typography color="red">
              <ExclamationCircleIcon className="d-inline-block "/> {text.toString()}
            </Typography>
    )
  }

  return (
          <Text
                  icon={ExclamationCircleIcon}
                  label={text.toString()}
                  variant="small"
                  color="red"
                  className="d-flex align-items-center gap-1 fw-normal"
          />
  )
}

export default memo(Error)