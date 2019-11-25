import { WGResponse, SimpleHandler } from '@/http/RequestHandler'
import { GlueBoardDoc } from '@@/migrate/schemas/glue-board'
import GlueBoard from '@@/migrate/models/glue-board'
import { FragmentDoc } from '@@/migrate/schemas/fragment'

interface GetHashResponseBody {
  hash: string
}

interface GetResponseBody {
  category: {
    name: string
    color: string
  }
  fragments: Array<{
    url: string
    selector: string
    xPos: number
    yPos: number
    scale: number
  }>
}

export default class SharingController {
  /**
   * Get the url hash of the shared GlueBoard
   */
  public static getHash(): SimpleHandler {
    return (req, res): WGResponse => {
      const glueBoard = res.locals.glueBoard as GlueBoardDoc

      // if sharing option is off, reject this request.
      if (glueBoard.sharing === false) {
        return res.status(403).json({
          err: {
            msg: 'Sharing option for this GlueBoard is off.'
          }
        })
      }

      const responseBody: GetHashResponseBody = {
        hash: glueBoard.id
      }

      return res.status(200).json(responseBody)
    }
  }

  /**
   * Access to the shared GlueBoard
   */
  public static get(): SimpleHandler {
    return async (req, res): Promise<WGResponse> => {
      const glueBoard = (await GlueBoard.findById(res.locals.glueBoard._id, {
        category: 1,
        fragments: 1
      })
        .lean()
        .populate({
          path: 'fragments',
          select: '-_id -id'
        })) as GlueBoardDoc

      const responseBody: GetResponseBody = {
        category: glueBoard.category,
        fragments: []
      }

      // compose response body
      for (const fragment of glueBoard.fragments as FragmentDoc[]) {
        responseBody.fragments.push({
          url: fragment.url,
          selector: fragment.selector,
          xPos: fragment.xPos,
          yPos: fragment.yPos,
          scale: fragment.scale
        })
      }

      return res.status(200).json(responseBody)
    }
  }
}
