import { IsEmail, Length } from 'class-validator'
import { Field, InputType } from 'type-graphql'

@InputType()
export class Credentials {

  @IsEmail()
  @Field()
  public readonly email: string

  @Length(5, 15)
  @Field()
  public readonly password: string
}