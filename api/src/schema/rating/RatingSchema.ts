import { Authorized, Field, Int, ObjectType } from 'type-graphql'
import Rating from '../../entities/rating/Rating'

@ObjectType()
export default class RatingSchema extends Rating {

  @Authorized()
  @Field(_type => Int, { nullable: true })
  public mark?: number
}