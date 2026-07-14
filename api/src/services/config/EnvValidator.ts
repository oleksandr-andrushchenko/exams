import Env from '../../schema/config/Env'
import { validateSync, ValidationError } from 'class-validator'

export default class EnvValidator {

  /**
   * @param {Env} env
   * @throws {Error}
   */
  public static validateEnv(env: Env): void {
    const errors: ValidationError[] = validateSync(env)

    if (errors.length > 0) {
      let constraints = {}

      for (const error of errors) {
        constraints = { ...constraints, ...error.constraints }
      }

      throw new Error(`Config validation error: ${ JSON.stringify(constraints) }`)
    }
  }
}