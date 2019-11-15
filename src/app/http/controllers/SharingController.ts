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
    return async (req, res): Promise<Response> => {
      const glueBoard = res.locals.glueBoard as GlueBoardDoc

      // if sharing option is off, turn on.
      if (glueBoard.sharing === false) {
        glueBoard.sharing = true
        await glueBoard.save()
      }

      const responseBody: GetResponseBody = {
        hash: glueBoard.id
      }

      return res.status(200).json(responseBody)
    }
  }
}
