export default interface ValidatorInterface {

  validate(object: object): Promise<void>

  validateId(id: string): void
}