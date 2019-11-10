import express from 'express'
import oauth2Router from '@@/routes/oauth2'
import meRouter from '@@/routes/me'
import { UserDoc } from '@@/migrate/schemas/user'
import mirroringRouter from '@@/routes/mirroring'

const mainRouter = express.Router()

/**
 * Sub router
 */
mainRouter.use('/oauth2', oauth2Router)
mainRouter.use('/me', meRouter)
mainRouter.use('/mirroring', mirroringRouter)

export default mainRouter
