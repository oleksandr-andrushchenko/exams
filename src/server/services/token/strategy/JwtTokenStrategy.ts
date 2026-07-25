import TokenStrategyInterface from './TokenStrategyInterface'
import * as jwt from 'jsonwebtoken'

export default class JwtTokenStrategy implements TokenStrategyInterface {

  public constructor(
    private readonly secret: string,
  ) {
  }

  public async sign(payload: object): Promise<string> {
    return await new Promise(resolve => resolve(jwt.sign(payload, this.secret, { expiresIn: '100d' })))
  }

  public async verify<Payload>(token: string): Promise<Payload> {
    return await new Promise(resolve => resolve(jwt.verify(token, this.secret) as Payload))
  }
}