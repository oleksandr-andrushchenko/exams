import { ComponentProps, memo } from 'react'
import Activity from '../../schema/activity/Activity'
import Route from '../../enum/Route'
import Link from '../elements/Link'
import AddExamSession from '../examSession/AddExamSession'

interface Props extends ComponentProps<any> {
  activity: Activity
}

const ExamApprovedActivity = ({activity}: Props) => {
  const exam = {id: activity.examId!}
  const link = Route.Exam.replace(':examId', exam.id)

  return <>
    <b><Link label={activity.examName} to={link}/></b>
    {' '}
    exam has been approved. You can start your examSession
    {' '}
    <b><Link label="here" to={link}/></b>
    {' '}
    or
    {' '}
    <AddExamSession exam={exam}/>
  </>
}

export default memo(ExamApprovedActivity)