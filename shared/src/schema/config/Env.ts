import { IsEnum, IsNumber, IsPositive, IsUrl } from 'class-validator'

export default class Env {
  @IsEnum(['development', 'test', 'production'])
  public readonly NODE_ENV: string

  @IsNumber({ maxDecimalPlaces: 0 })
  @IsPositive()
  public readonly PORT: number

  @IsEnum(['postgres'])
  public readonly DATABASE_TYPE: string

  @IsUrl({ require_valid_protocol: false, host_whitelist: ['postgres', 'localhost'] })
  public readonly DATABASE_URL: string
  public readonly DATABASE_SCHEMA: string

  @IsUrl({ host_whitelist: ['localhost'] })
  public readonly CLIENT_URL: string
  public readonly API_URL?: string

  public constructor(env: Record<string, string> = process.env) {
    Object.assign(this, env)
    this.DATABASE_TYPE = env.DATABASE_TYPE || 'postgres'
    this.CLIENT_URL = env.CLIENT_URL || 'http://localhost:3000'
    this.PORT = +this.PORT
  }
}
