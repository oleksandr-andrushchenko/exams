import { Inject, Service } from 'typedi'
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
import UserRatingProvider from '../services/user/UserRatingProvider'
import RatingSchema from '../schema/rating/RatingSchema'

@Service()
export class UserController {
  public constructor(
    @Inject() private readonly userProvider: UserProvider,
    @Inject() private readonly userListProvider: UserListProvider,
    @Inject() private readonly userCreator: UserCreator,
    @Inject() private readonly userUpdater: UserUpdater,
    @Inject() private readonly userDeleter: UserDeleter,
    @Inject() private readonly userRatingProvider: UserRatingProvider,
    @Inject('validator') private readonly validator: ValidatorInterface
  ) {}

  public async createUser(createUser: CreateUser, currentUser: User): Promise<User> {
    return await this.userCreator.createUser(createUser, currentUser)
  }

  public async updateUser(getUser: GetUser, updateUser: UpdateUser, currentUser: User): Promise<User> {
    await this.validator.validate(getUser)
    const user = await this.userProvider.getUser(getUser.userId)

    return await this.userUpdater.updateUser(user, updateUser, currentUser)
  }

  public async getUsers(getUsers: GetUsers): Promise<User[]> {
    return (await this.userListProvider.getUsers(getUsers, false)) as User[]
  }

  public async getPaginatedUsers(getUsers: GetUsers): Promise<PaginatedUsers> {
    return (await this.userListProvider.getUsers(getUsers, true)) as PaginatedUsers
  }

  public async getUser(getUser: GetUser): Promise<User> {
    await this.validator.validate(getUser)

    return await this.userProvider.getUser(getUser.userId)
  }

  public async getUserRating(user: User): Promise<RatingSchema | undefined> {
    return await this.userRatingProvider.getUserRating(user)
  }

  public async deleteUser(getUser: GetUser, currentUser: User): Promise<boolean> {
    await this.validator.validate(getUser)
    const user = await this.userProvider.getUser(getUser.userId)

    await this.userDeleter.deleteUser(user, currentUser)

    return true
  }
}
