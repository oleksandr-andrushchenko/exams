import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import UserRepository from '../../repositories/UserRepository'
import ValidatorInterface from '../validator/ValidatorInterface'
import UserPermission from '../../enums/user/UserPermission'
import Cursor from '../../models/Cursor'
import GetUsers from '../../schema/user/GetUsers'
import PaginatedUsers from '../../schema/user/PaginatedUsers'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'

@Service()
export default class UserListProvider {

  public constructor(
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {GetUsers} getUsers
   * @param {boolean} meta
   * @param {User} initiator
   * @returns {Promise<User[] | PaginatedUsers>}
   * @throws {ValidatorError}
   * @throws {AuthorizationFailedError}
   */
  public async getUsers(
    getUsers: GetUsers,
    meta: boolean,
    initiator: User,
  ): Promise<User[] | PaginatedUsers> {
    await this.authorizationVerifier.verifyAuthorization(initiator, UserPermission.Get)
    await this.validator.validate(getUsers)

    const cursor = new Cursor<User>(getUsers, this.userRepository)

    const where = {}

    if ('search' in getUsers) {
      where['$or'] = [
        { 'name': { $regex: getUsers.search, $options: 'i' } },
        { 'email': { $regex: getUsers.search, $options: 'i' } },
      ]
    }

    return await cursor.getPaginated({ where, meta })
  }
}