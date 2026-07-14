export default interface LoggerInterface {

  debug(message: string, ...args: unknown[]): LoggerInterface

  info(message: string, ...args: unknown[]): LoggerInterface

  warn(message: string, ...args: unknown[]): LoggerInterface

  error(message: string, ...args: unknown[]): LoggerInterface
}
