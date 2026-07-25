import Repository from '../decorators/Repository'
import EntityRepository from './EntityRepository'
import Activity from '../entities/activity/Activity'

@Repository(Activity)
export default class ActivityRepository extends EntityRepository<Activity> {
}