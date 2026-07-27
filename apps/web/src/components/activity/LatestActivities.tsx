import { ComponentProps, memo, useEffect, useState } from 'react'
import { apiQuery } from '../../client/graphql/apolloClient'
import Error from '../Error'
import Spinner from '../Spinner'
import getActivities from '../../client/graphql/activity/getActivities'
import Activity from '../../schema/activity/Activity'
import ExamEvent from '../../enum/exam/ExamEvent'
import ExamCreatedActivity from './ExamCreatedActivity'
import ExamApprovedActivity from './ExamApprovedActivity'

interface Props extends ComponentProps<any> {
}

const renderers: Record<string, (activity: Activity) => JSX.Element> = {
  [ExamEvent.Created]: (activity: Activity) => <ExamCreatedActivity activity={activity}/>,
  [ExamEvent.Approved]: (activity: Activity) => <ExamApprovedActivity activity={activity}/>,
}

const LatestActivities = ({}: Props) => {
  const [isLoading, setLoading] = useState<boolean>(true)
  const [activities, setActivities] = useState<Activity[]>([])
  const [error, setError] = useState<string>('')

  useEffect(() => {
    apiQuery(
            getActivities({size: 20}),
            async (data: { activities: Activity[] }) => setActivities(data.activities),
            setError,
            setLoading,
    )
  }, [])

  if (isLoading) {
    return <Spinner/>
  }

  return <>
    {error && <Error text={error}/>}

    {activities.map((activity: Activity, index: number) => (
            <div key={index}>
              {activity.event && activity.event in renderers ? renderers[activity.event](activity) : <></>}
            </div>
    ))}
  </>
}

export default memo(LatestActivities)