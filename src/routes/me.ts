import express from 'express'
import CheckLogin from '@/http/middleware/CheckLogin'
import ProfileController from '@/http/controllers/ProfileController'
import RequestValidationError from '@/http/middleware/RequestValidationError'
import Handle405Error from '@/http/middleware/Handle405Error'

const meRouter = express.Router({ mergeParams: true })

/**
 * Middleware
 */
meRouter.use('*', CheckLogin.handler())

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

export default meRouter
