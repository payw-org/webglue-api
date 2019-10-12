import express from 'express'
import CheckLogin from 'Http/middleware/CheckLogin'
import ProfileController from 'Http/controllers/ProfileController'
import RequestValidationError from 'Http/middleware/RequestValidationError'

const meRouter = express.Router({ mergeParams: true })

/**
 * Middleware
 */
meRouter.use('/', CheckLogin.handler())

/**
 * Controller
 */
// get current user info briefly
meRouter.get('/profile', ProfileController.index())

// update user profile
meRouter.patch(
  '/profile',
  ProfileController.validateUpdate(),
  RequestValidationError.handler(),
  ProfileController.update()
)

export default meRouter
