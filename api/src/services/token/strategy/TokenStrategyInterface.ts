export default interface TokenStrategyInterface {

  sign(payload: object): Promise<string>

  verify<Payload>(token: string): Promise<Payload>
}
