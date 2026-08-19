import { Inject, Service } from 'typedi'
import User from '../../../shared/src/entities/user/User'
import CreateMe from '../../../shared/src/schema/user/CreateMe'
import UpdateMe from '../../../shared/src/schema/user/UpdateMe'
import MeCreator from '../../../shared/src/services/me/MeCreator'
import MeUpdater from '../../../shared/src/services/me/MeUpdater'
import MeDeleter from '../../../shared/src/services/me/MeDeleter'
import { type Request, type Response } from 'express'
import { plainToInstance } from 'class-transformer'
import AuthUserProvider from '../../../shared/src/services/auth/AuthUserProvider'

@Service()
export class MeController {
  public constructor(
    @Inject() private readonly meCreator: MeCreator,
    @Inject() private readonly meUpdater: MeUpdater,
    @Inject() private readonly meDeleter: MeDeleter,
    @Inject() private readonly authUserProvider: AuthUserProvider
  ) {}

  public async createMeData(createMe: CreateMe): Promise<User> {
    return await this.meCreator.createMe(createMe)
  }

  public async getMeData(user: User): Promise<User> {
    return user
  }

  public async updateMeData(updateMe: UpdateMe, user: User): Promise<User> {
    return await this.meUpdater.updateMe(updateMe, user)
  }

  public async deleteMeData(user: User): Promise<boolean> {
    await this.meDeleter.deleteMe(user)

    return true
  }

  public async getMe(request: Request, response: Response): Promise<void> {
    response.json(await this.authUserProvider.getRequiredAuthUser(request))
  }

  public async createMe(request: Request, response: Response): Promise<void> {
    response.status(201).json(await this.createMeData(plainToInstance(CreateMe, request.body)))
  }

  public async updateMe(request: Request, response: Response): Promise<void> {
    response.json(
      await this.updateMeData(
        plainToInstance(UpdateMe, request.body),
        await this.authUserProvider.getRequiredAuthUser(request)
      )
    )
  }

  public async deleteMe(request: Request, response: Response): Promise<void> {
    response.json({ deleted: await this.deleteMeData(await this.authUserProvider.getRequiredAuthUser(request)) })
  }
}
