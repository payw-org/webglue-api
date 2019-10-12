import express from 'express'
import oauth2Router from 'Routes/oauth2'
import meRouter from 'Routes/me'
import { UserDoc } from 'Migrate/schemas/user'

const mainRouter = express.Router()

/**
 * Sub router
 */
mainRouter.use('/oauth2', oauth2Router)
mainRouter.use('/me', meRouter)

/**
 * Controller
 */
mainRouter.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      text: 'hello ' + (req.user as UserDoc).nickname
    })
  } else {
    res.json({
      test: 'u r not user'
    })
  }
})

export default mainRouter
