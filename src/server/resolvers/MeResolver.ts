import { Inject, Service } from 'typedi'
import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import User from '../entities/user/User'
import CreateMe from '../schema/user/CreateMe'
import UpdateMe from '../schema/user/UpdateMe'
import MeCreator from '../services/me/MeCreator'
import MeUpdater from '../services/me/MeUpdater'
import MeDeleter from '../services/me/MeDeleter'

@Service()
@Resolver(User)
export class MeResolver {

  public constructor(
    @Inject() private readonly meCreator: MeCreator,
    @Inject() private readonly meUpdater: MeUpdater,
    @Inject() private readonly meDeleter: MeDeleter,
  ) {
  }

  @Mutation(_returns => User)
  public async createMe(
    @Arg('createMe') createMe: CreateMe,
  ): Promise<User> {
    return await this.meCreator.createMe(createMe)
  }

  @Authorized()
  @Query(_returns => User, { name: 'me' })
  public async getMe(
    @Ctx('user') user: User,
  ): Promise<User> {
    return user
  }

  @Authorized()
  @Mutation(_returns => User)
  public async updateMe(
    @Arg('updateMe') updateMe: UpdateMe,
    @Ctx('user') user: User,
  ): Promise<User> {
    return await this.meUpdater.updateMe(updateMe, user)
  }

  @Authorized()
  @Mutation(_returns => Boolean)
  public async deleteMe(
    @Ctx('user') user: User,
  ): Promise<boolean> {
    await this.meDeleter.deleteMe(user)

    return true
  }
}