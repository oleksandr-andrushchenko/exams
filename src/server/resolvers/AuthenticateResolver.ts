import { Inject, Service } from 'typedi'
import { Arg, Mutation, Resolver } from 'type-graphql'
import UserProvider from '../services/user/UserProvider'
import { Credentials } from '../schema/auth/Credentials'
import Token from '../schema/auth/Token'
import AccessTokenCreator from '../services/auth/AccessTokenCreator'

@Service()
@Resolver()
export class AuthenticateResolver {

  public constructor(
    @Inject() private readonly userProvider: UserProvider,
    @Inject() private readonly accessTokenCreator: AccessTokenCreator,
  ) {
  }

  @Mutation(_returns => Token)
  public async createAuthenticationToken(
    @Arg('credentials') credentials: Credentials,
  ): Promise<Token> {
    const user = await this.userProvider.getUserByCredentials(credentials)

    return await this.accessTokenCreator.createAccessToken(user)
  }
}