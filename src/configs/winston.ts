import winston from 'winston'
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

const winstonConfig = {
  logOptions: {
    outFile: {
      level: 'info',
      filename: `${appRoot.path}/logs/out.log`,
      handleExceptions: true,
      json: false,
      maxsize: 5242880,
      maxFiles: 10,
      format: combine(timestamp(), printLog)
    },
    errorFile: {
      level: 'error',
      filename: `${appRoot.path}/logs/error.log`,
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
  },
  winston: winston
}

export default winstonConfig
