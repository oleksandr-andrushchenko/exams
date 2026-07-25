import { Service } from 'typedi'
import JwtTokenStrategy from './JwtTokenStrategy'

export type JwtTokenStrategyOptions = {
  secret: string,
};

@Service()
export default class JwtTokenStrategyFactory {

  public create(options: JwtTokenStrategyOptions): JwtTokenStrategy {
    return new JwtTokenStrategy(
      options.secret,
    )
  }
}