import { Inject, Service } from 'typedi'
import { type Request } from 'express'
import User from '../../entities/user/User'
import AuthenticationFailedError from '../../errors/auth/AuthenticationFailedError'
import { AuthCheckerService } from './AuthCheckerService'

@Service()
export default class AuthUserProvider {
  public constructor(@Inject() private readonly authChecker: AuthCheckerService) {
  }

  public async getAuthUser(request: Request): Promise<User | undefined> {
    return this.authChecker.getContextUser(request)
  }

  public async getRequiredAuthUser(request: Request): Promise<User> {
    const authUser = await this.getAuthUser(request)
    if (authUser) return authUser
    throw new AuthenticationFailedError()
  }
}
