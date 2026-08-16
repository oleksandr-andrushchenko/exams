import { Inject, Service } from 'typedi'
import TokenService, { TokenPayload } from '../token/TokenService'
import { Request } from 'express'

@Service()
export default class AccessTokenVerifier {
  public constructor(@Inject() private readonly tokenService: TokenService) {}

  public async verifyAccessToken(req: Request): Promise<string | null> {
    const header: string | undefined = req.header('Authorization')
    const bearerToken = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined
    const cookieToken = req
      .header('Cookie')
      ?.split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith('authenticationToken='))
      ?.slice('authenticationToken='.length)
    const token = bearerToken || cookieToken

    if (!token) {
      return null
    }

    const payload: TokenPayload | null = await this.tokenService.verifyAccessToken(token)

    if (!payload || !payload.userId) {
      return null
    }

    return payload.userId
  }
}
