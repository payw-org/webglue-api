import helmet from 'helmet'
import cors from 'cors'
import bodyParser from 'body-parser'
import express, { Express } from 'express'
import HandleClientError from 'Http/middleware/HandleClientError'
import HandleSyntaxError from 'Http/middleware/HandleSyntaxError'
import RequestValidationError from 'Http/middleware/RequestValidationError'
import HandleServerError from 'Http/middleware/HandleServerError'
import mainRouter from 'Routes/api'

export default class RouteServiceProvider {
  private static basicMiddleware = [
    helmet(),
    cors(),
    bodyParser.json(),
    bodyParser.urlencoded({ extended: true })
  ]

  private static errorHandlerMiddleware = [
    HandleClientError.handler(),
    HandleSyntaxError.handler(),
    RequestValidationError.handler(),
    HandleServerError.handler()
  ]

  public static boot(): Express {
    const app = express()
    app.set('trust proxy', 1) // trust first proxy
    app.use(this.basicMiddleware)
    app.use('/v1', mainRouter) // versioning
    app.use(this.errorHandlerMiddleware)

    return app
  }
}
