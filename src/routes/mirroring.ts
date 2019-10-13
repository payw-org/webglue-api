import express from 'express'
import MirroringController from 'Http/controllers/MirroringController'
import RequestValidationError from 'Http/middleware/RequestValidationError'
import Handle405Error from 'Http/middleware/Handle405Error'

const mirroringRouter = express.Router({ mergeParams: true })

/**
 * Controller
 */

/**
 * GET: get mirrored html file
 */
mirroringRouter
  .route('/html')
  .get(
    MirroringController.validateGetHTML(),
    RequestValidationError.handler(),
    MirroringController.getHTML()
  )
  .all(Handle405Error.handler())

export default mirroringRouter
