import Repository from '../../database/Repository'
import EntityRepository from '../../database/EntityRepository'
import Activity from '../../entities/activity/Activity'

@Repository(Activity)
export default class ActivityRepository extends EntityRepository<Activity> {}
