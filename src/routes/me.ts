import express from 'express'
import CheckLogin from '@/http/middleware/CheckLogin'
import ProfileController from '@/http/controllers/ProfileController'
import RequestValidationError from '@/http/middleware/RequestValidationError'
import Handle405Error from '@/http/middleware/Handle405Error'
import GlueBoardController from '@/http/controllers/GlueBoardController'
import CheckGlueBoard from '@/http/middleware/CheckGlueBoard'

const meRouter = express.Router({ mergeParams: true })

/**
 * Middleware
 */
meRouter.use('*', CheckLogin.handler())
meRouter.use(
  '/glueboards/:glueboard',
  CheckGlueBoard.validate(),
  RequestValidationError.handler(),
  CheckGlueBoard.handler()
)

/**
 * Controller
 */

/**
 * GET: get current user info briefly
 * PATCH: update user profile
 */
meRouter
  .route('/profile')
  .get(ProfileController.index())
  .patch(
    ProfileController.validateUpdate(),
    RequestValidationError.handler(),
    ProfileController.update()
  )
  .all(Handle405Error.handler())

/**
 * GET: get user's all GlueBoards
 * POST: create new GlueBoard
 */
meRouter
  .route('/glueboards')
  .get(GlueBoardController.index())
  .post(
    GlueBoardController.validateCreate(),
    RequestValidationError.handler(),
    GlueBoardController.create()
  )
  .all(Handle405Error.handler())

/**
 * GET: get the GlueBoard
 * DELETE: delete the GlueBoard
 */
meRouter
  .route('/glueboards/:glueboard')
  .get(GlueBoardController.get())
  .delete(GlueBoardController.delete())
  .all(Handle405Error.handler())

export default meRouter
