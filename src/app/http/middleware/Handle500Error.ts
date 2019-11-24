import { Response, ErrorHandler } from '@/http/RequestHandler'
import LogHelper from '@/modules/LogHelper'

export default class Handle500Error {
  /**
   * Handle 500 http error.
   * This is last error handler.
   */
  public static handler(): ErrorHandler {
    return (err, req, res, next): Response => {
      LogHelper.log('error', err.stack)

      return res.status(500).json({
        err: {
          msg: 'Internal server error'
        }
      })
    }
  }
}
