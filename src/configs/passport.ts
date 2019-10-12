import passport from 'passport'
import nanoid from 'nanoid'
import { Strategy } from 'passport-google-oauth20'
import User from '../migrate/models/user'
import { UserDoc } from '../migrate/schemas/user'

/**
 * OAuth strategy
 * Check if user is registered and update last login date.
 */
passport.use(
  new Strategy(
    {
      clientID: process.env.GOOGLE_OAUTH2_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH2_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_OAUTH2_CALLBACK_URL
    },
    (accessToken, refreshToken, profile, done): void => {
      const googleId = profile.id
      const email = profile.emails[0].value
      const nickname = email.split('@')[0] + '-' + nanoid(5)
      const image = profile.photos[0].value
      const name = profile.displayName

      User.findOneAndUpdate(
        { googleId: googleId },
        { loggedInAt: new Date() },
        (err, user) => {
          if (!user) {
            User.create({
              googleId: googleId,
              email: email,
              nickname: nickname,
              image: image,
              name: name
            }).then(newUser => {
              done(err, newUser)
            })
          } else {
            done(err, user)
          }
        }
      ).lean()
    }
  )
)

// serialize id of user document
passport.serializeUser((user: UserDoc, done) => {
  done(null, user._id)
})

// deserialize to user document
passport.deserializeUser((_id, done) => {
  User.findById(_id, (err, user) => {
    done(err, user)
  }).lean()
})

export default passport
