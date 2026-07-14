import LoggerInterface from './LoggerInterface'
import winston from 'winston'
import Logger from './Logger'
import { Service } from 'typedi'
import { WinstonLoggerFactory } from './WinstonLoggerFactory'

@Service({ factory: [ WinstonLoggerFactory, 'create' ] })
export default class WinstonLogger extends Logger implements LoggerInterface {

  public constructor(private readonly winstonLogger: winston.Logger) {
    super()
  }

  protected log(level: string, message: string, args: unknown[]): LoggerInterface {
    this.winstonLogger.log(level, message, args)

    return this
  }
}
