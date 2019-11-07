import express from 'express'
import CheckLogin from '@/http/middleware/CheckLogin'
import ProfileController from '@/http/controllers/ProfileController'
import RequestValidationError from '@/http/middleware/RequestValidationError'
import Handle405Error from '@/http/middleware/Handle405Error'
import GlueBoardController from '@/http/controllers/GlueBoardController'
import CheckGlueBoard from '@/http/middleware/CheckGlueBoard'
import FragmentController from '@/http/controllers/FragmentController'
import CheckFragment from '@/http/middleware/CheckFragment'

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

meRouter.use(
  '/glueboards/:glueboard/fragments/:fragment',
  CheckFragment.validate(),
  RequestValidationError.handler(),
  CheckFragment.handler()
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
 * PATCH: move the GlueBoard order in collection
 */
meRouter
  .route('/glueboards')
  .get(GlueBoardController.index())
  .post(
    GlueBoardController.validateCreate(),
    RequestValidationError.handler(),
    GlueBoardController.create()
  )
  .patch(
    GlueBoardController.validateMove(),
    RequestValidationError.handler(),
    GlueBoardController.move()
  )
  .all(Handle405Error.handler())

/**
 * GET: get the GlueBoard
 * PATCH: partial update the GlueBoard
 * DELETE: delete the GlueBoard
 */
meRouter
  .route('/glueboards/:glueboard')
  .get(GlueBoardController.get())
  .patch(
    GlueBoardController.validateUpdate(),
    RequestValidationError.handler(),
    GlueBoardController.update()
  )
  .delete(GlueBoardController.delete())
  .all(Handle405Error.handler())

/**
 * GET: get all fragments of the GlueBoard
 * POST: create new fragment
 */
meRouter
  .route('/glueboards/:glueboard/fragments')
  .get(FragmentController.index())
  .post(
    FragmentController.validateCreate(),
    RequestValidationError.handler(),
    FragmentController.create()
  )
  .all(Handle405Error.handler())

/**
 * GET: get the fragment
 * DELETE: delete the fragment
 */
meRouter
  .route('/glueboards/:glueboard/fragments/:fragment')
  .get(FragmentController.get())
  .delete(FragmentController.delete())
  .all(Handle405Error.handler())

export default meRouter
