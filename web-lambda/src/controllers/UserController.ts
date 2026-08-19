import { Inject, Service } from 'typedi'
import { type Request, type Response } from 'express'
import { queryObject } from '../../../shared/src/http'
import UserProvider from '../../../shared/src/services/user/UserProvider'
import AuthUserProvider from '../../../shared/src/services/auth/AuthUserProvider'
import AuthorizationVerifier from '../../../shared/src/services/auth/AuthorizationVerifier'
import UserPermission from '../../../shared/src/enums/user/UserPermission'
import UserRepository from '../../../shared/src/repositories/users/UserRepository'

@Service()
export default class UserController {
  public constructor(
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly userProvider: UserProvider,
    @Inject() private readonly authUserProvider: AuthUserProvider,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier
  ) {
  }

  public async listUsers(request: Request, response: Response): Promise<void> {
    const filters = this.filters(request)
    response.render('users.html', { page: await this.userRepository.getUserList(filters), filters, title: 'Users' })
  }

  public async editUser(request: Request, response: Response): Promise<void> {
    const currentUser = await this.authUserProvider.getRequiredAuthUser(request)
    const user = await this.userProvider.getUser(request.params.userId)
    await this.authorizationVerifier.verifyAuthorization(currentUser, UserPermission.Update, user)
    response.render('edit.html', { resource: 'user', user })
  }

  public async getUser(request: Request, response: Response): Promise<void> {
    const user = await this.userProvider.getUser(request.params.userId)
    const [ exams, sessions ] = await Promise.all([
      this.userRepository.getUserExams(user.id.toString()),
      this.userRepository.getUserExamSessions(user.id.toString())
    ])
    response.render('user.html', { user, exams, sessions, title: user.name })
  }

  public async getPublicUser(request: Request, response: Response): Promise<void> {
    await this.getUser(request, response)
  }

  private filters(request: Request): Record<string, unknown> {
    const query = queryObject(request.query)
    const page = Number(query.page)
    const size = Number(query.size)
    return {
      page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
      size: Math.min(50, Number.isFinite(size) && size > 0 ? Math.floor(size) : 20)
    }
  }
}
