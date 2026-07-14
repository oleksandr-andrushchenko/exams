import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import UserProvider from '../user/UserProvider'
import { AuthChecker, AuthenticationError, AuthorizationError } from 'type-graphql'
import Context from '../../context/Context'
import { Request } from 'express'
import AuthorizationFailedError from '../../errors/auth/AuthorizationFailedError'
import AuthorizationVerifier from './AuthorizationVerifier'
import AccessTokenVerifier from './AccessTokenVerifier'

@Service()
export class AuthCheckerService {

  public constructor(
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @Inject() private readonly accessTokenVerifier: AccessTokenVerifier,
    @Inject() private readonly userProvider: UserProvider,
  ) {
  }

  public async getApolloContextUser(req: Request): Promise<User | undefined> {
    const userId: string | null = await this.accessTokenVerifier.verifyAccessToken(req)

    if (userId) {
      return await this.userProvider.getUser(userId)
    }

    return undefined
  }

  public getTypeGraphqlAuthChecker(): AuthChecker<Context> {
    return async ({ root, context: { user } }, permissions): Promise<boolean> => {
      // https://typegraphql.com/docs/authorization.html
      if (!user) {
        throw new AuthenticationError()
      }

      for (const permission of permissions) {
        try {
          await this.authorizationVerifier.verifyAuthorization(user, permission, root)
        } catch (error) {
          if (error instanceof AuthorizationFailedError) {
            throw new AuthorizationError()
          }

          throw error
        }
      }

      return true
    }
  }
}