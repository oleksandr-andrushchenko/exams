import LoggerInterface from './LoggerInterface'
import Logger from './Logger'

export default class NullLogger extends Logger implements LoggerInterface {

  protected log(level: string, message: string, args: unknown[]): LoggerInterface {
    return this
  }
}
