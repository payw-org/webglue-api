import express from 'express'
import oauth2Router from 'Routes/oauth2'

const mainRouter = express.Router()

/**
 * Sub router
 */
mainRouter.use('/oauth2', oauth2Router)
})

export default mainRouter
