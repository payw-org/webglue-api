import { checkSchema, ValidationChain } from 'express-validator'
import { WGResponse, NextHandler } from '@/http/RequestHandler'
import Fragment from '@@/migrate/models/fragment'
import { GlueBoardDoc } from '@@/migrate/schemas/glue-board'

export default class CheckFragment {
  public static validate(): ValidationChain[] {
    return checkSchema({
      fragment: {
        exists: true,
        in: 'params',
        isString: true,
        trim: true,
        errorMessage: '`fragment` must be a string.'
      }
    })
  }

  /**
   * Check if fragment is exist and is in the current GlueBoard.
   * If so, find the fragment document and pass to next handler.
   */
  public static handler(): NextHandler {
    return async (req, res, next): Promise<WGResponse | void> => {
      const fragmentID = req.params.fragment
      const fragment = await Fragment.findOne({
        id: fragmentID
      })

      // not exist
      if (!fragment) {
        return res.status(404).json({
          err: {
            msg: 'Fragment not found.'
          }
        })
      }

      const glueBoard = res.locals.glueBoard as GlueBoardDoc // current GlueBoard

      // if fragment is not in the current GlueBoard
      if (!glueBoard.fragments.includes(fragment._id)) {
        return res.status(403).json({
          err: {
            msg: "You don't have permission to this fragment."
          }
        })
      }

      res.locals.fragment = fragment

      return next()
    }
  }
}
