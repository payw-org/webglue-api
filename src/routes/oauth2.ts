import express from 'express'
import passport from 'passport'
import { UserDoc } from 'Migrate/schemas/user'
import User from 'Migrate/models/user'
import url from 'url'

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
  async (req, res) => {
    const user = req.user as UserDoc

    if (user.isNew) {
      await user.save()

      res.redirect(
        url.format({
          pathname: process.env.DOMAIN,
          query: {
            isnew: true
          }
        })
      )
    } else {
      res.redirect(process.env.DOMAIN)
    }
  }
)

export default oauth2Router
