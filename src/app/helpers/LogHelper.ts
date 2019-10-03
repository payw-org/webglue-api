import winston, { Logger } from 'winston'
import Bottleneck from 'bottleneck'
import appRoot from 'app-root-path'

const { printf, combine, timestamp, colorize } = winston.format

const printLog = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`
})

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'blue',
  debug: 'gray'
}
winston.addColors(logColors)

const logOptions = {
  outFile: {
    level: 'info',
    filename: appRoot.path + '/logs/out.log',
    handleExceptions: true,
    json: false,
    maxsize: 5242880,
    maxFiles: 10,
    format: combine(timestamp(), printLog)
  },
  errorFile: {
    level: 'error',
    filename: appRoot.path + '/logs/error.log',
    handleExceptions: true,
    json: false,
    maxsize: 5242880,
    maxFiles: 3,
    format: combine(timestamp(), printLog)
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
    format: combine(colorize(), timestamp(), printLog)
  }
}

type levelOptions = 'error' | 'warn' | 'info' | 'http' | 'debug'

export default class LogHelper {
  /**
   * Rate limiter for logger
   */
  private static rateLimiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 5
  })

  /**
   * Winston logger
   */
  private static logger = winston.createLogger({
    transports: [
      new winston.transports.File(logOptions.outFile),
      new winston.transports.File(logOptions.errorFile),
      new winston.transports.Console(logOptions.console)
    ],
    exitOnError: false
  })

  public static getLogger(): Logger {
    return this.logger
  }

  /**
   * Log with rate limiting.
   *
   * @param level
   * @param message
   */
  public static log(level: levelOptions, message: string): void {
    this.rateLimiter.schedule({}, () => {
      return Promise.resolve(this.getLogger().log({ level, message }))
    })
  }
}
