import { ComponentProps, memo } from 'react'
import { apiMutate, apiQuery } from '../../api/apolloClient'
import rateExam from '../../api/exam/rateExam'
import Exam from '../../schema/exam/Exam'
import sleep from '../../utils/sleep'
import Rating from '../Rating'
import getExam from '../../api/exam/getExam'

interface Props extends ComponentProps<any> {
  className?: string
  exam: Exam,
  showAverageMark?: boolean
  showMarkCount?: boolean
  onChange?: Function
  readonly?: boolean
}

const _RateExam = (
  {
    className = '',
    exam,
    onChange,
    showAverageMark = false,
    showMarkCount = false,
    readonly = false,
  }: Props,
) => {
  return (
    <Rating
      className={ className }
      rating={ exam.rating! }
      showAverageMark={ showAverageMark }
      showMarkCount={ showMarkCount }
      onChange={
        (mark, setRating, { setError, setLoading }) => {
          setLoading(true)
          apiMutate(
            rateExam(exam.id!, mark),
            async (data: { rateExam: Exam }) => {
              await sleep(100)
              apiQuery(
                getExam(data.rateExam.id!),
                (data: { exam: Exam }) => {
                  setRating(data.exam.rating ?? {})
                  onChange && onChange(data.exam)
                },
                setError,
              ).finally(() => setLoading(false))
            },
            setError,
          )
        }
      }
      readonly={ readonly }
    />
  )
}

export const RateExam = memo(_RateExam)