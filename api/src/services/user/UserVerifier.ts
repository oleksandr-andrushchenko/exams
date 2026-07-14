import { Inject, Service } from 'typedi'
import UserRepository from '../../repositories/UserRepository'
import UserEmailTakenError from '../../errors/user/UserEmailTakenError'
import { ObjectId } from 'mongodb'

@Service()
export default class UserVerifier {

  public constructor(
    @Inject() private readonly userRepository: UserRepository,
  ) {
  }

  /**
   * @param {string} email
   * @param {ObjectId} ignoreId
   * @returns {Promise<void>}
   * @throws {UserEmailTakenError}
   */
  public async verifyUserEmailNotExists(email: string, ignoreId: ObjectId = undefined): Promise<void> {
    const user = await this.userRepository.findOneByEmail(email)

    if (!user) {
      return
    }

    if (ignoreId && user.id.toString() === ignoreId.toString()) {
      return
    }

    throw new UserEmailTakenError(email)
  }
}