import { Inject, Service } from 'typedi'
import User from '../../entities/user/User'
import TokenStrategyInterface from './strategy/TokenStrategyInterface'

export type GeneratedToken = {
  token: string;
  expires: number;
};

export enum TokenType {
  ACCESS = 'access',
}

export type TokenPayload = {
  userId: string;
  type: TokenType;
  expires?: number,
};

@Service()
export default class TokenService {

  public constructor(
    @Inject('tokenStrategy') private readonly tokenStrategy: TokenStrategyInterface,
  ) {
  }

  public async generateAccessToken(user: User, expiresIn: number): Promise<GeneratedToken> {
    const expires = Date.now() + expiresIn
    const payload = { userId: user.id.toString(), type: TokenType.ACCESS }
    const token = await this.tokenStrategy.sign(payload)

    return { token, expires }
  }

  public async verifyAccessToken(encoded: string): Promise<TokenPayload | null> {
    return await this.verifyToken(encoded, TokenType.ACCESS)
  }

  public async verifyToken(encoded: string, type: TokenType): Promise<TokenPayload | null> {
    const payload = await this.tokenStrategy.verify<TokenPayload>(encoded)

    if (!payload?.userId || payload?.type !== type) {
      return null
    }

    return payload
  }
}
