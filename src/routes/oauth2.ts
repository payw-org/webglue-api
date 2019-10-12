import express from 'express'
import passport from 'passport'
import Handle405Error from 'Http/middleware/Handle405Error'
import OAuth2Controller from 'Http/controllers/OAuth2Controller'

const oauth2Router = express.Router({ mergeParams: true })

/**
 * Controller
 */

/**
 * GET: google login
 */
oauth2Router
  .route('/google')
  .get(
    passport.authenticate('google', {
      scope: ['profile', 'email']
    })
  )
  .all(Handle405Error.handler())

/**
 * GET: google login callback
 */
oauth2Router
  .route('/google/callback')
  .get(passport.authenticate('google'), OAuth2Controller.googleCallback())
  .all(Handle405Error.handler())

export default oauth2Router
