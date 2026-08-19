import { IsNumber, IsString } from 'class-validator'

export default class Token {
  @IsString()
  public token: string

  @IsNumber()
  public expires: number
}
