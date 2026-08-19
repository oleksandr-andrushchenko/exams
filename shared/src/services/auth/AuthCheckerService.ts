import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import UserProvider from '../user/UserProvider'
import { Request } from 'express'
import AccessTokenVerifier from './AccessTokenVerifier'

@Service()
export class AuthCheckerService {
  public constructor(
    @Inject() private readonly accessTokenVerifier: AccessTokenVerifier,
    @Inject() private readonly userProvider: UserProvider
  ) {}

  public async getContextUser(req: Request): Promise<User | undefined> {
    const userId: string | null = await this.accessTokenVerifier.verifyAccessToken(req)

    if (userId) {
      return await this.userProvider.getUser(userId)
    }

    return undefined
  }
}
