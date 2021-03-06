import { WGResponse, NextHandler } from '@/http/RequestHandler'

export default class CheckLogin {
  /**
   * Check if user is logged in
   * If not, return with 401 unauthorized status code.
   */
  public static handler(): NextHandler {
    return (req, res, next): WGResponse | void => {
      if (req.isUnauthenticated()) {
        return res.status(401).json({
          err: {
            msg: 'Login required'
          }
        })
      }

      return next()
    }
  }
}
