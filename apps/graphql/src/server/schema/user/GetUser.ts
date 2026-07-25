import { IsMongoId } from 'class-validator'
import { ArgsType, Field, ID } from 'type-graphql'

@ArgsType()
export default class GetUser {

  @IsMongoId()
  @Field(_type => ID)
  public readonly userId: string
}