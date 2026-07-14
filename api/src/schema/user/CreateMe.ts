import { IsEmail, IsOptional, IsStrongPassword, Length } from 'class-validator'
import { Field, InputType } from 'type-graphql'

@InputType()
export default class CreateMe {

  @IsOptional()
  @Length(2, 30)
  @Field({ nullable: true })
  public readonly name?: string

  @IsEmail()
  @Field()
  public readonly email: string

  @Length(5, 15)
  @IsStrongPassword({ minLength: 5, minLowercase: 0, minNumbers: 0, minSymbols: 0, minUppercase: 0 })
  @Field()
  public readonly password: string
}