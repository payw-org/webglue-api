import { Response, NextHandler } from '@/http/RequestHandler'
import GlueBoard from '@@/migrate/models/glue-board'
import { GlueBoardDoc } from '@@/migrate/schemas/glue-board'

export default class CheckSharing {
  public static handler(): NextHandler {
    return async (req, res, next): Promise<Response | void> => {
      const glueBoardID = req.params.glueboard
      const glueBoard = (await GlueBoard.findOne({
        id: glueBoardID
      })) as GlueBoardDoc

      if (!glueBoard) {
        return res.status(404).json({
          err: {
            msg: 'Glueboard not found.'
          }
        })
      }

      if (!glueBoard.sharing) {
        return res.status(403).json({
          err: {
            msg: 'Unshared GlueBoard.'
          }
        })
      }

      res.locals.glueBoard = glueBoard

      return next()
    }
  }
}
