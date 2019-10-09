import { Response, SimpleHandler } from 'Http/RequestHandler'

export default class HandleClientError {
  /**
   * Handle 404 http error.
   */
  public static handler(): SimpleHandler {
    return (req, res): Response => {
      return res.status(404).json({
        err: {
          msg: 'Request not found'
        }
      })
    }
  }
}
