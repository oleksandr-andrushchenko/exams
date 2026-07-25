import { ArrayUnique, IsEmail, IsEnum, IsStrongPassword, Length, ValidateIf } from 'class-validator'
import { Field, InputType } from 'type-graphql'
import Permission from '../../enums/Permission'

@InputType()
export default class UpdateUser {

  @ValidateIf(target => 'name' in target)
  @Length(2, 30)
  @Field({ nullable: true })
  public readonly name?: string

  @ValidateIf(target => 'email' in target)
  @IsEmail()
  @Field({ nullable: true })
  public readonly email?: string

  @ValidateIf(target => 'password' in target)
  @Length(5, 15)
  @IsStrongPassword({ minLength: 5, minLowercase: 0, minNumbers: 0, minSymbols: 0, minUppercase: 0 })
  @Field({ nullable: true })
  public readonly password?: string

  @ValidateIf(target => 'permissions' in target)
  @IsEnum(Permission, { each: true })
  @ArrayUnique()
  @Field(_type => [ String ], { nullable: true })
  public readonly permissions?: Permission[]
}