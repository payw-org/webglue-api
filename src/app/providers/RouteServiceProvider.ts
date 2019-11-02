import helmet from 'helmet'
import cors from 'cors'
import bodyParser from 'body-parser'
import express, { Express } from 'express'
import session from '@@/configs/session'
import passport from '@@/configs/passport'
import Handle404Error from '@/http/middleware/Handle404Error'
import HandleSyntaxError from '@/http/middleware/HandleSyntaxError'
import Handle500Error from '@/http/middleware/Handle500Error'
import mainRouter from '@@/routes/api'

export default class RouteServiceProvider {
  /**
   * Basic middleware list which is globally applied to router.
   */
  private static basicMiddleware = [
    helmet.frameguard({
      action: 'allow-from',
      domain: 'https://eodiro.com'
    }),
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
