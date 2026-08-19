import { IsEmail, IsString, IsStrongPassword, Length, ValidateIf } from 'class-validator'

export default class UpdateMe {
  @ValidateIf((target) => 'name' in target)
  @Length(2, 30)
  public readonly name?: string

  @ValidateIf((target) => 'imageFilename' in target)
  @IsString()
  @Length(1, 255)
  public readonly imageFilename?: string

  @ValidateIf((target) => 'email' in target)
  @IsEmail()
  public readonly email?: string

  @ValidateIf((target) => 'password' in target)
  @Length(5, 15)
  @IsStrongPassword({ minLength: 5, minLowercase: 0, minNumbers: 0, minSymbols: 0, minUppercase: 0 })
  public readonly password?: string
}
