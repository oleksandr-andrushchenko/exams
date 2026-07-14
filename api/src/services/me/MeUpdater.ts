import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import InjectEntityManager, { EntityManagerInterface } from '../../decorators/InjectEntityManager'
import ValidatorInterface from '../validator/ValidatorInterface'
import UpdateMe from '../../schema/user/UpdateMe'
import UserVerifier from '../user/UserVerifier'
import EventDispatcher from '../event/EventDispatcher'
import MeEvent from '../../enums/me/MeEvent'

@Service()
export default class MeUpdater {

  public constructor(
    @InjectEntityManager() private readonly entityManager: EntityManagerInterface,
    @Inject() private readonly eventDispatcher: EventDispatcher,
    @Inject('validator') private readonly validator: ValidatorInterface,
    @Inject() private readonly userVerifier: UserVerifier,
  ) {
  }

  public async updateMe(updateMe: UpdateMe, initiator: User): Promise<User> {
    await this.validator.validate(updateMe)

    if ('email' in updateMe) {
      const email = updateMe.email
      await this.userVerifier.verifyUserEmailNotExists(email, initiator.id)
      initiator.email = email
    }

    if ('name' in updateMe) {
      initiator.name = updateMe.name
    }

    if ('password' in updateMe) {
      initiator.password = updateMe.password
    }

    initiator.updatedAt = new Date()

    await this.entityManager.save<User>(initiator)
    this.eventDispatcher.dispatch(MeEvent.Updated, { me: initiator })

    return initiator
  }
}