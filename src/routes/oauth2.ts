import express from 'express'
import passport from 'passport'

const oauth2Router = express.Router({ mergeParams: true })

/**
 * Controller
 */
// google login
oauth2Router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })
)

// google login callback
oauth2Router.get(
  '/google/callback',
  passport.authenticate('google'),
  (req, res) => {
    res.redirect(process.env.CLIENT_HOME_URL)
  }
)

export default oauth2Router
