import express from 'express'
import oauth2Router from '@@/routes/oauth2'
import meRouter from '@@/routes/me'
import mirroringRouter from '@@/routes/mirroring'
import CheckGlueBoard from '@/http/middleware/CheckGlueBoard'
import RequestValidationError from '@/http/middleware/RequestValidationError'
import CheckSharing from '@/http/middleware/CheckSharing'
import SharingController from '@/http/controllers/SharingController'
import Handle405Error from '@/http/middleware/Handle405Error'

const mainRouter = express.Router()

/**
 * Middleware
 */

mainRouter.use(
  '/sharing/:glueboard',
  CheckGlueBoard.validate(),
  RequestValidationError.handler(),
  CheckSharing.handler()
)

/**
 * Sub router
 */

mainRouter.use('/oauth2', oauth2Router)
mainRouter.use('/me', meRouter)
mainRouter.use('/mirroring', mirroringRouter)

/**
 * Controller
 */

/**
 * GET: access to the shared GlueBoard
 */
mainRouter
  .route('/sharing/:glueboard')
  .get(SharingController.get())
  .all(Handle405Error.handler())

export default mainRouter
