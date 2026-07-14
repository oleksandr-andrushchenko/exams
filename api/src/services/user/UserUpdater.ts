import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import ValidatorInterface from '../validator/ValidatorInterface'
import UserPermission from '../../enums/user/UserPermission'
import UpdateUser from '../../schema/user/UpdateUser'
import UserVerifier from './UserVerifier'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import EventDispatcher from '../event/EventDispatcher'
import UserEvent from '../../enums/user/UserEvent'

@Service()
export default class UserUpdater {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly userVerifier: UserVerifier,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {User} user
   * @param {UpdateUser} updateUser
   * @param {User} initiator
   * @returns {Promise<User>}
   * @throws {UserNotFoundError}
   * @throws {AuthorizationFailedError}
   * @throws {UserEmailTakenError}
   */
  public async updateUser(user: User, updateUser: UpdateUser, initiator: User): Promise<User> {
    await this.validator.validate(updateUser)
    await this.authorizationVerifier.verifyAuthorization(initiator, UserPermission.Update, user)

    if ('email' in updateUser) {
      const email = updateUser.email
      await this.userVerifier.verifyUserEmailNotExists(email, user.id)
      user.email = email
    }

    if ('password' in updateUser) {
      user.password = updateUser.password
    }

    if ('name' in updateUser) {
      user.name = updateUser.name
    }

    if ('permissions' in updateUser) {
      user.permissions = updateUser.permissions
    }

    user.updatedAt = new Date()

    await this.entityManager.save<User>(user)
    this.eventDispatcher.dispatch(UserEvent.Updated, { user })

    return user
  }
}