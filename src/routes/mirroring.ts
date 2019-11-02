import express from 'express'
import MirroringController from '@/http/controllers/MirroringController'
import RequestValidationError from '@/http/middleware/RequestValidationError'
import Handle405Error from '@/http/middleware/Handle405Error'

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
