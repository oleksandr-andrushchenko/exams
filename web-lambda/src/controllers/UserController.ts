import { Inject, Service } from 'typedi'
import { type Request, type Response } from 'express'
import UserProvider from '../../../shared/src/services/user/UserProvider'
import AuthUserProvider from '../../../shared/src/services/auth/AuthUserProvider'
import AuthorizationVerifier from '../../../shared/src/services/auth/AuthorizationVerifier'
import UserRepository from '../../../shared/src/repositories/users/UserRepository'
import User from "../../../shared/src/entities/user/User"
import Permission from "../../../shared/src/enums/Permission"
import ExamRepository from "../../../shared/src/repositories/exams/ExamRepository";
import ExamSessionRepository from "../../../shared/src/repositories/exams/ExamSessionRepository";

@Service()
export default class UserController {
  public constructor(
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly examRepository: ExamRepository,
    @Inject() private readonly examSessionRepository: ExamSessionRepository,
    @Inject() private readonly userProvider: UserProvider,
    @Inject() private readonly authUserProvider: AuthUserProvider,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier
  ) {
  }

  public async indexUsers(_request: Request, response: Response): Promise<void> {
    response.render('users.html', {
      users: await this.userRepository.findLastUsers(),
      title: 'Users'
    })
  }

  public async editUser(request: Request, response: Response): Promise<void> {
    const curUser = await this.authUserProvider.getRequiredAuthUser(request)
    const user = await this.userProvider.getUser(request.params.userId)
    await this.authorizationVerifier.verifyAuthorization(curUser, Permission.UpdateUser, user)
    response.render('edit-user.html', {
      curUser,
      user,
      title: `Edit ${ user.name } User`,
    })
  }

  private async _showUser(user: User, request: Request, response: Response): Promise<void> {
    const [ rawExams, sessions ] = await Promise.all([
      this.examRepository.findByCreatorId(user.id),
      this.examSessionRepository.findByCreatorId(user.id)
    ])
    const exams = {
      data: rawExams.map((exam) => Object.assign(exam, { userSlug: user.slug }))
    }
    const curUser = await this.authUserProvider.getAuthUser(request)

    response.render('user.html', {
      curUser,
      user,
      exams,
      sessions,
      title: user.name
    })
  }

  public async showUser(request: Request, response: Response): Promise<void> {
    const user = await this.userProvider.getUser(request.params.userId)
    await this._showUser(user, request, response)
  }

  public async showUserBySlug(request: Request, response: Response): Promise<void> {
    const user = await this.userProvider.getUserBySlug(request.params.userSlug)
    await this._showUser(user, request, response)
  }
}
