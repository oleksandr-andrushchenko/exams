import { Inject, Service } from 'typedi'
import UserProvider from '../../../shared/src/services/user/UserProvider'
import { Credentials } from '../../../shared/src/schema/auth/Credentials'
import Token from '../../../shared/src/schema/auth/Token'
import AccessTokenCreator from '../../../shared/src/services/auth/AccessTokenCreator'
import { type Request, type Response } from 'express'
import { plainToInstance } from 'class-transformer'
import config from '../../../shared/src/config'
import TokenService from '../../../shared/src/services/token/TokenService'

@Service()
export class AuthenticateController {
  public constructor(
    @Inject() private readonly userProvider: UserProvider,
    @Inject() private readonly accessTokenCreator: AccessTokenCreator,
    @Inject() private readonly tokenService: TokenService
  ) {}

  public async createAuthenticationToken(credentials: Credentials): Promise<Token> {
    const user = await this.userProvider.getUserByCredentials(credentials)

    return await this.accessTokenCreator.createAccessToken(user)
  }

  public async token(request: Request, response: Response): Promise<void> {
    response.json(await this.createAuthenticationToken(plainToInstance(Credentials, request.body)))
  }

  public async login(request: Request, response: Response): Promise<void> {
    const target =
      typeof request.body.redirect === 'string' &&
      request.body.redirect.startsWith('/') &&
      !request.body.redirect.startsWith('//')
        ? request.body.redirect
        : '/'
    try {
      const user =
        config.env === 'development' && request.body.autoLogin === true
          ? await this.userProvider.getRootUser()
          : await this.userProvider.getUserByCredentials(
              plainToInstance(Credentials, { email: request.body.email, password: request.body.password })
            )
      const { token } = await this.tokenService.generateAccessToken(user, 100 * 24 * 60 * 60 * 1000)
      response.cookie('authenticationToken', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.env === 'production'
      })
      response.json({ redirect: target })
    } catch (error) {
      response
        .status(401)
        .json({ error: { status: 401, message: error instanceof Error ? error.message : 'Authentication failed' } })
    }
  }

  public async logout(_request: Request, response: Response): Promise<void> {
    response.clearCookie('authenticationToken')
    response.json({ redirect: config.client_url })
  }
}
