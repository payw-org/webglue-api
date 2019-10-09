import express from 'express'
import CheckLogin from 'Http/middleware/CheckLogin'
import MeController from 'Http/controllers/MeController'

const meRouter = express.Router({ mergeParams: true })

/**
 * Middleware
 */
meRouter.use('/', CheckLogin.handler())

/**
 * Controller
 */
// get current user info briefly
meRouter.get('/', MeController.index())

export default meRouter
