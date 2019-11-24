import { Response, ErrorHandler } from '@/http/RequestHandler'
import LogHelper from '@/modules/LogHelper'

export default class HandleSyntaxError {
  /**
   * Handle request syntax error.
   */
  public static handler(): ErrorHandler {
    return (err, req, res, next): Response | void => {
      if (err instanceof SyntaxError) {
        LogHelper.Instance.log('error', err.stack)

        return res.status(400).json({
          err: {
            msg: 'Request syntax error'
          }
        })
      } else {
        next()
      }
    }
  }
}
