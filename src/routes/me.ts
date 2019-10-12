import express from 'express'
import CheckLogin from 'Http/middleware/CheckLogin'
import ProfileController from 'Http/controllers/ProfileController'
import RequestValidationError from 'Http/middleware/RequestValidationError'
import Handle405Error from 'Http/middleware/Handle405Error'

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
