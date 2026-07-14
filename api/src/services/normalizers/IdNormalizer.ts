import { Inject, Service } from 'typedi'
import ValidatorInterface from '../validator/ValidatorInterface'
import { ObjectId } from 'mongodb'

@Service()
export default class IdNormalizer {

  public constructor(
    @Inject('validator') private readonly validator: ValidatorInterface,
  ) {
  }

  /**
   * @param {ObjectId | string} id
   * @returns {ObjectId}
   * @throws {AuthorizationFailedError}
   */
  public normalizeId(id: ObjectId | string): ObjectId {
    if (typeof id === 'string') {
      this.validator.validateId(id)
      id = new ObjectId(id)
    }

    return id
  }
}