import { Authorized, Field, Int, ObjectType } from 'type-graphql'
import Rating from '../../entities/rating/Rating'

@ObjectType()
export default class RatingSchema extends Rating {
  @Field((_type) => String, { nullable: true })
  public html?: string

  @Authorized()
  @Field((_type) => Int, { nullable: true })
  public mark?: number
}
