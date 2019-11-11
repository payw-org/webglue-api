import expressSession from 'express-session'
import uuidV5 from 'uuid/v5'
import uuidV1 from 'uuid/v1'
import connectMongo from 'connect-mongo'
import mongoose from 'mongoose'

const session = expressSession({
  genid: (): string => {
    return uuidV5(uuidV1(), uuidV5.DNS)
  },
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  name: process.env.SESSION_NAME,
  store: new (connectMongo(expressSession))({
    mongooseConnection: mongoose.connection
  }),
  cookie: {
    domain: '.webglue.me', // root and all sub domain
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    secure: true // use only when https
  }
})

export default session
