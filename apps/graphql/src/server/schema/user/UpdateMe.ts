import { IsEmail, IsString, IsStrongPassword, Length, ValidateIf } from 'class-validator'
import { Field, InputType } from 'type-graphql'

@InputType()
export default class UpdateMe {
  @ValidateIf((target) => 'name' in target)
  @Length(2, 30)
  @Field({ nullable: true })
  public readonly name?: string

  @ValidateIf((target) => 'imageFilename' in target)
  @IsString()
  @Length(1, 255)
  @Field({ nullable: true })
  public readonly imageFilename?: string

  @ValidateIf((target) => 'email' in target)
  @IsEmail()
  @Field({ nullable: true })
  public readonly email?: string

  @ValidateIf((target) => 'password' in target)
  @Length(5, 15)
  @IsStrongPassword({ minLength: 5, minLowercase: 0, minNumbers: 0, minSymbols: 0, minUppercase: 0 })
  @Field({ nullable: true })
  public readonly password?: string
}
