import { ValidationError } from 'class-validator'

export default class ValidatorError extends Error {

  public constructor(private readonly errors: ValidationError[]) {
    super(`Validation errors ${ JSON.stringify(errors) }`)
  }
}