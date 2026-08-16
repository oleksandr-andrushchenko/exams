import { Inject, Service } from 'typedi'
import UserProvider from '../services/user/UserProvider'
import { Credentials } from '../schema/auth/Credentials'
import Token from '../schema/auth/Token'
import AccessTokenCreator from '../services/auth/AccessTokenCreator'

@Service()
export class AuthenticateController {
  public constructor(
    @Inject() private readonly userProvider: UserProvider,
    @Inject() private readonly accessTokenCreator: AccessTokenCreator
  ) {}

  public async createAuthenticationToken(credentials: Credentials): Promise<Token> {
    const user = await this.userProvider.getUserByCredentials(credentials)

    return await this.accessTokenCreator.createAccessToken(user)
  }
}
