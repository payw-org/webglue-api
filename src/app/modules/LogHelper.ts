import winstonConfig from '@@/configs/winston'
import { Logger } from 'winston'

type levelOptions = 'error' | 'warn' | 'info' | 'http' | 'debug'

export default class LogHelper {
  private static _instance: LogHelper

  /**
   * winston logger
   */
  private logger: Logger

  /**
   * Get singleton instance
   *
   * @constructor
   */
  public static get Instance(): LogHelper {
    if (this._instance === undefined) {
      this._instance = new this()
    }

    return this._instance
  }

  /**
   * Initialize logger
   */
  private constructor() {
    this.logger = winstonConfig.winston.createLogger({
      transports: [
        new winstonConfig.winston.transports.File(
          winstonConfig.logOptions.outFile
        ),
        new winstonConfig.winston.transports.File(
          winstonConfig.logOptions.errorFile
        ),
        new winstonConfig.winston.transports.Console(
          winstonConfig.logOptions.console
        )
      ],
      exitOnError: false
    })
  }

  public log(level: levelOptions, message: string): Logger {
    return this.logger.log({ level, message })
  }
}
