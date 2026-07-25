import PaginatedSchema from '../pagination/PaginatedSchema'
import { ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { Field, ObjectType } from 'type-graphql'
import User from '../../entities/user/User'

@ObjectType()
export default class PaginatedUsers extends PaginatedSchema<User> {

  @ValidateNested({ each: true })
  @Type(() => User)
  @Field(_type => [ User ])
  public data: User[]
}