import PaginatedSchema from '../pagination/PaginatedSchema'
import { ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { Field, ObjectType } from 'type-graphql'
import Activity from '../../entities/activity/Activity'

@ObjectType()
export default class PaginatedActivityList extends PaginatedSchema<Activity> {

  @ValidateNested({ each: true })
  @Type(() => Activity)
  @Field(_type => [ Activity ])
  public data: Activity[]
}