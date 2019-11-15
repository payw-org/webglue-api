import { Response, SimpleHandler } from '@/http/RequestHandler'
import { GlueBoardDoc } from '@@/migrate/schemas/glue-board'

interface GetResponseBody {
  hash: string
}

export default class SharingController {
  /**
   * Get the url hash of shared GlueBoard
   */
  public static get(): SimpleHandler {
    return (req, res): Response => {
      const glueBoard = res.locals.glueBoard as GlueBoardDoc

      // if sharing option is off, reject this request.
      if (glueBoard.sharing === false) {
        return res.status(403).json({
          err: {
            msg: 'Sharing option for this GlueBoard is off.'
          }
        })
      }

      const responseBody: GetResponseBody = {
        hash: glueBoard.id
      }

      return res.status(200).json(responseBody)
    }
  }
}
