import WinstonLogger from './WinstonLogger'
import { Inject, Service } from 'typedi'
import winston, { configure, format, transports } from 'winston'

@Service()
export class WinstonLoggerFactory {

  public constructor(
    @Inject('loggerLevel') private readonly level: string,
    @Inject('loggerFormat') private readonly format: string,
  ) {
  }

  public create(): WinstonLogger {
    const winstonLogger: winston.Logger = winston.clear()

    configure({
      transports: [
        new transports.Console({
          level: this.level,
          handleExceptions: true,
          format: this.format === 'dev'
            ? format.combine(
              format.splat(),
              format.colorize(),
              format.simple(),
            )
            : format.combine(
              format.json(),
            ),
        }),
      ],
    })

    return new WinstonLogger(winstonLogger)
  }
}