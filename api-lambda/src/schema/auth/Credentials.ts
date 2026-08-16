import { IsEmail, Length } from 'class-validator'

export class Credentials {
  @IsEmail()
  public readonly email: string

  @Length(5, 15)
  public readonly password: string
}
