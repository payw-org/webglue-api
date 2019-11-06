import { checkSchema, ValidationChain } from 'express-validator'
import { Response, NextHandler } from '@/http/RequestHandler'
import GlueBoard from '@@/migrate/models/glue-board'
import { UserDoc } from '@@/migrate/schemas/user'

export default class CheckGlueBoard {
  /**
   * Validator for GlueBoard
   */
  public static validate(): ValidationChain[] {
    return checkSchema({
      glueboard: {
        exists: true,
        in: 'params',
        isString: true,
        trim: true,
        errorMessage: '`glueboard` must be a string.'
      }
    })
  }

  /**
   * Check if GlueBoard is exist and is current user's.
   * If so, find the GlueBoard document and pass to next handler.
   */
  public static handler(): NextHandler {
    return async (req, res, next): Promise<Response | void> => {
      const glueBoardID = req.params.glueboard
      const glueBoard = await GlueBoard.findOne({
        id: glueBoardID
      })

      if (!glueBoard) {
        return res.status(404).json({
          err: {
            msg: 'Glueboard not found.'
          }
        })
      }

      // if the GlueBoard is not the current user's
      const userGlueBoardIDs = (req.user as UserDoc).glueBoards
      if (!userGlueBoardIDs.includes(glueBoard._id)) {
        return res.status(403).json({
          err: {
            msg: "You don't have permission to this GlueBoard."
          }
        })
      }

      res.locals.glueBoard = glueBoard

      return next()
    }
  }
}
