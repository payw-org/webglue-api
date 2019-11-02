import { NextHandler, Response } from '@/http/RequestHandler'
import { validationResult } from 'express-validator'

export default class RequestValidationError {
  /**
   * Handle http request validation error.
   */
  public static handler(): NextHandler {
    return (req, res, next): Response | void => {
      const errors = validationResult(req)

      if (!errors.isEmpty()) {
        return res
          .status(422)
          .json({ errors: errors.array({ onlyFirstError: true }) })
      } else {
        next()
      }
    }
  }
}
