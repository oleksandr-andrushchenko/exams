import { Inject, Service } from 'typedi'
import TokenService, { TokenPayload } from '../token/TokenService'
import { Request } from 'express'

@Service()
export default class AccessTokenVerifier {

  public constructor(
    @Inject() private readonly tokenService: TokenService,
  ) {
  }

  public async verifyAccessToken(req: Request): Promise<string | null> {
    const header: string | undefined = req.header('Authorization')

    if (!header) {
      return null
    }

    const parts: string[] = header.split(' ')

    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
      return null
    }

    const payload: TokenPayload | null = await this.tokenService.verifyAccessToken(parts[1])

    if (!payload || !payload.userId) {
      return null
    }

    return payload.userId
  }
}