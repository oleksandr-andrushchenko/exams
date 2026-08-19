import PaginatedSchema from '../pagination/PaginatedSchema'
import { ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import User from '../../entities/user/User'

export default class PaginatedUsers extends PaginatedSchema<User> {
  @ValidateNested({ each: true })
  @Type(() => User)
  public data: User[]
}
