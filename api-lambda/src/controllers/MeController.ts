import { Inject, Service } from 'typedi'
import User from '../entities/user/User'
import CreateMe from '../schema/user/CreateMe'
import UpdateMe from '../schema/user/UpdateMe'
import MeCreator from '../services/me/MeCreator'
import MeUpdater from '../services/me/MeUpdater'
import MeDeleter from '../services/me/MeDeleter'

@Service()
export class MeController {
  public constructor(
    @Inject() private readonly meCreator: MeCreator,
    @Inject() private readonly meUpdater: MeUpdater,
    @Inject() private readonly meDeleter: MeDeleter
  ) {}

  public async createMe(createMe: CreateMe): Promise<User> {
    return await this.meCreator.createMe(createMe)
  }

  public async getMe(user: User): Promise<User> {
    return user
  }

  public async updateMe(updateMe: UpdateMe, user: User): Promise<User> {
    return await this.meUpdater.updateMe(updateMe, user)
  }

  public async deleteMe(user: User): Promise<boolean> {
    await this.meDeleter.deleteMe(user)

    return true
  }
}
