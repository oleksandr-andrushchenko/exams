import { Inject, Service } from 'typedi'
import { Arg, Args, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import User from '../entities/user/User'
import UserProvider from '../services/user/UserProvider'
import CreateUser from '../schema/user/CreateUser'
import GetUsers from '../schema/user/GetUsers'
import PaginatedUsers from '../schema/user/PaginatedUsers'
import UpdateUser from '../schema/user/UpdateUser'
import ValidatorInterface from '../services/validator/ValidatorInterface'
import GetUser from '../schema/user/GetUser'
import UserCreator from '../services/user/UserCreator'
import UserUpdater from '../services/user/UserUpdater'
import UserDeleter from '../services/user/UserDeleter'
import UserListProvider from '../services/user/UserListProvider'

@Service()
@Resolver(User)
export class UserResolver {

  public constructor(
    @Inject() private readonly userProvider: UserProvider,
    @Inject() private readonly userListProvider: UserListProvider,
    @Inject() private readonly userCreator: UserCreator,
    @Inject() private readonly userUpdater: UserUpdater,
    @Inject() private readonly userDeleter: UserDeleter,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  @Authorized()
  @Mutation(_returns => User)
  public async createUser(
    @Arg('createUser') createUser: CreateUser,
    @Ctx('user') currentUser: User,
  ): Promise<User> {
    return await this.userCreator.createUser(createUser, currentUser)
  }

  @Authorized()
  @Mutation(_returns => User)
  public async updateUser(
    @Args() getUser: GetUser,
    @Arg('updateUser') updateUser: UpdateUser,
    @Ctx('user') currentUser: User,
  ): Promise<User> {
    await this.validator.validate(getUser)
    const user = await this.userProvider.getUser(getUser.userId)

    return await this.userUpdater.updateUser(user, updateUser, currentUser)
  }

  @Authorized()
  @Query(_returns => [ User ], { name: 'users' })
  public async getUsers(
    @Args() getUsers: GetUsers,
    @Ctx('user') currentUser: User,
  ): Promise<User[]> {
    return await this.userListProvider.getUsers(getUsers, false, currentUser) as User[]
  }

  @Authorized()
  @Query(_returns => PaginatedUsers, { name: 'paginatedUsers' })
  public async getPaginatedUsers(
    @Args() getUsers: GetUsers,
    @Ctx('user') currentUser: User,
  ): Promise<PaginatedUsers> {
    return await this.userListProvider.getUsers(getUsers, true, currentUser) as PaginatedUsers
  }

  @Authorized()
  @Mutation(_returns => Boolean)
  public async deleteUser(
    @Args() getUser: GetUser,
    @Ctx('user') currentUser: User,
  ): Promise<boolean> {
    await this.validator.validate(getUser)
    const user = await this.userProvider.getUser(getUser.userId)

    await this.userDeleter.deleteUser(user, currentUser)

    return true
  }
}