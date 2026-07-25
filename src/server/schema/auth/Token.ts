import { IsNumber, IsString } from 'class-validator'
import { Field, Int, ObjectType } from 'type-graphql'

@ObjectType()
export default class Token {

  @IsString()
  @Field()
  public token: string

  @IsNumber()
  public expires: number
}