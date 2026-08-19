import { Inject, Service } from 'typedi'
import User from '../../../shared/src/entities/user/User'
import UserProvider from '../../../shared/src/services/user/UserProvider'
import CreateUser from '../../../shared/src/schema/user/CreateUser'
import GetUsers from '../../../shared/src/schema/user/GetUsers'
import PaginatedUsers from '../../../shared/src/schema/user/PaginatedUsers'
import UpdateUser from '../../../shared/src/schema/user/UpdateUser'
import ValidatorInterface from '../../../shared/src/services/validator/ValidatorInterface'
import GetUser from '../../../shared/src/schema/user/GetUser'
import UserCreator from '../../../shared/src/services/user/UserCreator'
import UserUpdater from '../../../shared/src/services/user/UserUpdater'
import UserDeleter from '../../../shared/src/services/user/UserDeleter'
import UserListProvider from '../../../shared/src/services/user/UserListProvider'
import UserRatingProvider from '../../../shared/src/services/user/UserRatingProvider'
import RatingSchema from '../../../shared/src/schema/rating/RatingSchema'
import AuthUserProvider from '../../../shared/src/services/auth/AuthUserProvider'
import { Request, Response } from 'express'
import { plainToInstance } from 'class-transformer'
import { queryObject } from '../../../shared/src/http'

@Service()
export class UserController {
  public constructor(
    @Inject() private readonly userProvider: UserProvider,
    @Inject() private readonly userListProvider: UserListProvider,
    @Inject() private readonly userCreator: UserCreator,
    @Inject() private readonly userUpdater: UserUpdater,
    @Inject() private readonly userDeleter: UserDeleter,
    @Inject() private readonly userRatingProvider: UserRatingProvider,
    @Inject() private readonly authUserProvider: AuthUserProvider,
    @Inject('validator') private readonly validator: ValidatorInterface
  ) {}

  public async createUserData(createUser: CreateUser, currentUser: User): Promise<User> {
    return await this.userCreator.createUser(createUser, currentUser)
  }

  public async updateUser(request: Request, response: Response): Promise<void> {
    const currentUser = await this.authUserProvider.getRequiredAuthUser(request)
    const updateUser = plainToInstance(UpdateUser, request.body)

    const getUser = plainToInstance(GetUser, { userId: request.params.userId })
    await this.validator.validate(getUser)
    const user = await this.userProvider.getUser(getUser.userId)

    const res = await this.userUpdater.updateUser(user, updateUser, currentUser)

    response.json(res)
  }

  public async getUsersData(getUsers: GetUsers): Promise<User[]> {
    return (await this.userListProvider.getUsers(getUsers, false)) as User[]
  }

  public async getPaginatedUsers(getUsers: GetUsers): Promise<PaginatedUsers> {
    return (await this.userListProvider.getUsers(getUsers, true)) as PaginatedUsers
  }

  public async getUserData(getUser: GetUser): Promise<User> {
    await this.validator.validate(getUser)

    return await this.userProvider.getUser(getUser.userId)
  }

  public async getUserRating(user: User): Promise<RatingSchema | undefined> {
    return await this.userRatingProvider.getUserRating(user)
  }

  public async deleteUserData(getUser: GetUser, currentUser: User): Promise<boolean> {
    await this.validator.validate(getUser)
    const user = await this.userProvider.getUser(getUser.userId)

    await this.userDeleter.deleteUser(user, currentUser)

    return true
  }

  public async getUsers(request: Request, response: Response): Promise<void> {
    response.json(await this.getUsersData(plainToInstance(GetUsers, queryObject(request.query))))
  }

  public async getUser(request: Request, response: Response): Promise<void> {
    response.json(await this.getUserData(plainToInstance(GetUser, { userId: request.params.userId })))
  }

  public async createUser(request: Request, response: Response): Promise<void> {
    const currentUser = await this.authUserProvider.getRequiredAuthUser(request)
    response.status(201).json(await this.createUserData(plainToInstance(CreateUser, request.body), currentUser))
  }

  public async deleteUser(request: Request, response: Response): Promise<void> {
    const currentUser = await this.authUserProvider.getRequiredAuthUser(request)
    response.json({
      deleted: await this.deleteUserData(plainToInstance(GetUser, { userId: request.params.userId }), currentUser)
    })
  }
  public async upload(request: Request, response: Response): Promise<void> {
    await this.authUserProvider.getRequiredAuthUser(request)
    if (!request.file) {
      response.status(400).json({ error: { status: 400, message: 'A valid image is required' } })
      return
    }
    response.json({ filename: request.file.filename })
  }
}
