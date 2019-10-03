import express from 'express'

const mainRouter = express.Router()

mainRouter.get('/test', (req, res) => {
  res.json({
    test: 'hello'
  })
})

export default mainRouter
