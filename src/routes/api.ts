import express from 'express'
import oauth2Router from 'Routes/oauth2'
import meRouter from 'Routes/me'

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
      user: req.user
    })
  } else {
    res.json({
      test: 'dfdf'
    })
  }
})

export default mainRouter
