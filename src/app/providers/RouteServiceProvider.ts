import helmet from 'helmet'
import cors from 'cors'
import bodyParser from 'body-parser'
import express, { Express } from 'express'
import session from 'Configs/session'
import passport from 'Configs/passport'
import HandleClientError from 'Http/middleware/HandleClientError'
import HandleSyntaxError from 'Http/middleware/HandleSyntaxError'
import HandleServerError from 'Http/middleware/HandleServerError'
import mainRouter from 'Routes/api'

export default class RouteServiceProvider {
  /**
   * Basic middleware list which is globally applied to router.
   */
  private static basicMiddleware = [
    helmet(),
    cors({
      origin: process.env.DOMAIN
    }),
    bodyParser.json(),
    bodyParser.urlencoded({ extended: true }),
    session,
    passport.initialize(),
    passport.session()
  ]

  /**
   * Error handler middleware list which handle http error.
   */
  private static errorHandlerMiddleware = [
    HandleClientError.handler(),
    HandleSyntaxError.handler(),
    HandleServerError.handler()
  ]

  /**
   * Boot main router.
   */
  public static boot(): Express {
    const app = express()
    app.set('trust proxy', 1) // trust first proxy
    app.use(this.basicMiddleware)
    app.use('/v1', mainRouter) // versioning
    app.use(this.errorHandlerMiddleware)

    return app
  }
}
