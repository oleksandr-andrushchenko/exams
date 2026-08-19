import { IsEmail, IsOptional, IsString, IsStrongPassword, Length } from 'class-validator'

export default class CreateMe {
  @IsOptional()
  @Length(2, 30)
  public readonly name?: string

  @IsOptional()
  @IsString()
  @Length(1, 255)
  public readonly imageFilename?: string

  @IsOptional()
  @IsString()
  @Length(1, 7000000)
  public readonly imageData?: string

  @IsEmail()
  public readonly email: string

  @Length(5, 15)
  @IsStrongPassword({ minLength: 5, minLowercase: 0, minNumbers: 0, minSymbols: 0, minUppercase: 0 })
  public readonly password: string
}
