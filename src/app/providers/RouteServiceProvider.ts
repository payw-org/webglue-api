import helmet from 'helmet'
import cors from 'cors'
import bodyParser from 'body-parser'
import express, { Express } from 'express'
import session from 'Configs/session'
import passport from 'Configs/passport'
import Handle404Error from 'Http/middleware/Handle404Error'
import HandleSyntaxError from 'Http/middleware/HandleSyntaxError'
import Handle500Error from 'Http/middleware/Handle500Error'
import mainRouter from 'Routes/api'

export default class RouteServiceProvider {
  /**
   * Basic middleware list which is globally applied to router.
   */
  private static basicMiddleware = [
    helmet(),
    cors({
      origin: process.env.DOMAIN,
      credentials: true
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
    Handle404Error.handler(),
    HandleSyntaxError.handler(),
    Handle500Error.handler()
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
