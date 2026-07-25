import LoggerInterface from './LoggerInterface'

export default abstract class Logger implements LoggerInterface {

  public debug(message: string, ...args: unknown[]): LoggerInterface {
    return this.log('debug', message, args)
  }

  public info(message: string, ...args: unknown[]): LoggerInterface {
    return this.log('info', message, args)
  }

  public warn(message: string, ...args: unknown[]): LoggerInterface {
    return this.log('warn', message, args)
  }

  public error(message: string, ...args: unknown[]): LoggerInterface {
    return this.log('error', message, args)
  }

  protected abstract log(level: string, message: string, args: unknown[]): LoggerInterface;
}
