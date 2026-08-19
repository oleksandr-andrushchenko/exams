import PaginatedSchema from '../pagination/PaginatedSchema'
import { ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import Activity from '../../entities/activity/Activity'

export default class PaginatedActivityList extends PaginatedSchema<Activity> {
  @ValidateNested({ each: true })
  @Type(() => Activity)
  public data: Activity[]
}
