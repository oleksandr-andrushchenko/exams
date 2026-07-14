import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import TokenService from '../token/TokenService'
import Token from '../../schema/auth/Token'
import EventDispatcher from '../event/EventDispatcher'

@Service()
export default class AccessTokenCreator {

  public constructor(
    @Inject() private readonly tokenService: TokenService,
    @Inject() private readonly eventDispatcher: EventDispatcher,
    private readonly tokenExpiresIn: number = 60 * 60 * 24 * 7,
  ) {
  }

  public async createAccessToken(user: User): Promise<Token> {
    const token = await this.tokenService.generateAccessToken(user, this.tokenExpiresIn)

    this.eventDispatcher.dispatch('authenticationCreated', { user })

    return token
  }
}