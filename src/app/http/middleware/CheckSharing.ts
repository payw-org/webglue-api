import { Response, NextHandler } from '@/http/RequestHandler'
import GlueBoard from '@@/migrate/models/glue-board'
import { GlueBoardDoc } from '@@/migrate/schemas/glue-board'
import { checkSchema, ValidationChain } from 'express-validator'

export default class CheckSharing {
  public static validate(): ValidationChain[] {
    return checkSchema({
      hash: {
        exists: true,
        in: 'params',
        isString: true,
        trim: true,
        errorMessage: '`hash` must be a string.'
      }
    })
  }

  public static handler(): NextHandler {
    return async (req, res, next): Promise<Response | void> => {
      const glueBoardID = req.params.hash
      const glueBoard = (await GlueBoard.findOne({
        id: glueBoardID
      })) as GlueBoardDoc

      // cannot find the GlueBoard which is corresponding to hash
      if (!glueBoard) {
        return res.status(404).json({
          err: {
            msg: 'Glueboard not found.'
          }
        })
      }

      // sharing option for this GlueBoard is off
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
