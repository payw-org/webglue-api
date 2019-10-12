import { Response, SimpleHandler } from 'Http/RequestHandler'

export default class Handle405Error {
  /**
   * Handle 404 http error.
   */
  public static handler(): SimpleHandler {
    return (req, res): Response => {
      return res.status(405).json()
    }
  }
}
