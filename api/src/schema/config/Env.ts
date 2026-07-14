import { IsEnum, IsNumber, IsPositive, IsUrl } from 'class-validator'

export default class Env {

  @IsEnum([ 'development', 'test', 'production' ])
  public readonly NODE_ENV: string

  @IsNumber({ maxDecimalPlaces: 0 })
  @IsPositive()
  public readonly PORT: number

  @IsEnum([ 'mongodb' ])
  public readonly DATABASE_TYPE: string

  @IsUrl({ require_valid_protocol: false, host_whitelist: [ 'mongo' ] })
  public readonly DATABASE_URL: string

  @IsUrl({ host_whitelist: [ 'localhost' ] })
  public readonly CLIENT_URL: string

  public constructor(env: Record<string, string> = process.env) {
    Object.assign(this, env)
    this.PORT = +this.PORT
  }
}