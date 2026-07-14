import { Inject, Service } from 'typedi'
import { validateOrReject, ValidationError, ValidatorOptions } from 'class-validator'
import ValidatorInterface from './ValidatorInterface'
import ValidatorError from '../../errors/validator/ValidatorError'

@Service()
export default class ClassValidatorValidator implements ValidatorInterface {

  public constructor(
    @Inject('validatorOptions') private readonly options: ValidatorOptions,
  ) {
  }

  public async validate(object: object): Promise<void> {
    try {
      await validateOrReject(object, this.options)
    } catch (errors) {
      throw new ValidatorError((errors as ValidationError[]))
    }
  }

  public validateId(id: string): void {
    if (id.length !== 24) {
      const error = new ValidationError()
      error.property = 'id'
      error.value = id
      error.constraints = {isMongoId: 'id must be a mongodb id'}

      throw new ValidatorError([ error ])
    }
  }
}