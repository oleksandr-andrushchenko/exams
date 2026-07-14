import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import UserPermission from '../../enums/user/UserPermission'
import AuthorizationVerifier from '../auth/AuthorizationVerifier'
import EventDispatcher from '../event/EventDispatcher'
import UserEvent from '../../enums/user/UserEvent'

@Service()
export default class UserDeleter {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly authorizationVerifier: AuthorizationVerifier,
    @Inject() private readonly eventDispatcher: EventDispatcher,
  ) {
  }

  /**
   * @param {User} user
   * @param {User} initiator
   * @returns {Promise<User>}
   * @throws {AuthorizationFailedError}
   */
  public async deleteUser(user: User, initiator: User): Promise<User> {
    await this.authorizationVerifier.verifyAuthorization(initiator, UserPermission.Delete, user)

    user.deletedAt = new Date()

    await this.entityManager.save<User>(user)
    this.eventDispatcher.dispatch(UserEvent.Deleted, { user })

    return user
  }
}