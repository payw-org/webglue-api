import { Response, SimpleHandler } from '@/http/RequestHandler'
import { GlueBoardDoc } from '@@/migrate/schemas/glue-board'
import GlueBoard from '@@/migrate/models/glue-board'
import { FragmentDoc } from '@@/migrate/schemas/fragment'
import Fragment from '@@/migrate/models/fragment'
import generate from 'nanoid/generate'
import { checkSchema, ValidationChain } from 'express-validator'

interface IndexResponseBody {
  fragments: Array<{
    id: string
    url: string
    selector: string
    xPos: number
    yPos: number
    scale: number
  }>
}

export default class FragmentController {
  /**
   * Get all fragments of the GlueBoard.
   */
  public static index(): SimpleHandler {
    return async (req, res): Promise<Response> => {
      // populate fragments
      const glueBoard = (await GlueBoard.findById(res.locals.glueBoard._id, {
        _id: 0,
        fragments: 1
      })
        .lean()
        .populate({
          path: 'fragments'
        })) as GlueBoardDoc

      const fragments = glueBoard.fragments as FragmentDoc[]

      const responseBody: IndexResponseBody = {
        fragments: []
      }

      // compose response body
      for (const fragment of fragments) {
        responseBody.fragments.push({
          id: fragment.id,
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
