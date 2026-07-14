import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import UserRepository from '../../repositories/UserRepository'
import UserNotFoundError from '../../errors/user/UserNotFoundError'
import UserWrongCredentialsError from '../../errors/user/UserWrongCredentialsError'
import { Credentials } from '../../schema/auth/Credentials'
import ValidatorInterface from '../validator/ValidatorInterface'
import { ObjectId } from 'mongodb'
import UserEmailNotFoundError from '../../errors/user/UserEmailNotFoundError'
import UserPasswordManager from './UserPasswordManager'

@Service()
export default class UserProvider {

  public constructor(
    @Inject() private readonly userRepository: UserRepository,
    @Inject() private readonly userPasswordManager: UserPasswordManager,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {Credentials} credentials
   * @returns {Promise<User | null>}
   * @throws {UserWrongCredentialsError}
   * @throws {UserEmailNotFoundError}
   */
  public async getUserByCredentials(credentials: Credentials): Promise<User | null> {
    await this.validator.validate(credentials)

    const email: string = credentials.email
    const user: User = await this.getUserByEmail(email)

    if (!await this.userPasswordManager.compareUserPassword(user, credentials.password)) {
      throw new UserWrongCredentialsError()
    }

    return user
  }

  /**
   * @param {string} email
   * @returns {Promise<User>}
   * @throws {UserEmailNotFoundError}
   */
  public async getUserByEmail(email: string): Promise<User> {
    const user: User = await this.userRepository.findOneByEmail(email)

    if (!user) {
      throw new UserEmailNotFoundError(email)
    }

    return user
  }

  /**
   * @param {ObjectId | string} id
   * @returns {Promise<User>}
   * @throws {UserNotFoundError}
   */
  public async getUser(id: ObjectId | string): Promise<User> {
    if (typeof id === 'string') {
      this.validator.validateId(id)
      id = new ObjectId(id)
    }

    const user: User = await this.userRepository.findOneById(id)

    if (!user) {
      throw new UserNotFoundError(id)
    }

    return user
  }
}