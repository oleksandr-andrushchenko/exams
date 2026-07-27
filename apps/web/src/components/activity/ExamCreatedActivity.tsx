import { ComponentProps, memo } from 'react'
import Activity from '../../schema/activity/Activity'
import Route from '../../enum/Route'
import Link from '../elements/Link'
import AddQuestion from '../question/AddQuestion'

interface Props extends ComponentProps<any> {
  activity: Activity
}

const ExamCreatedActivity = ({activity}: Props) => {
  const exam = {id: activity.examId!}
  const link = Route.Exam.replace(':examId', exam.id)

  return <>
    <b><Link label={activity.examName} to={link}/></b>
    {' '}
    exam has been created. You can add your own questions
    {' '}
    <b><Link label="here" to={link}/></b>
    {' '}
    or
    {' '}
    <AddQuestion exam={exam}/>
  </>
}

export default memo(ExamCreatedActivity)