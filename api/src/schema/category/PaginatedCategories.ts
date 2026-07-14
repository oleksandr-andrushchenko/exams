import PaginatedSchema from '../pagination/PaginatedSchema'
import Category from '../../entities/category/Category'
import { ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { Field, ObjectType } from 'type-graphql'

@ObjectType()
export default class PaginatedCategories extends PaginatedSchema<Category> {

  @ValidateNested({ each: true })
  @Type(() => Category)
  @Field(_type => [ Category ])
  public data: Category[]
}