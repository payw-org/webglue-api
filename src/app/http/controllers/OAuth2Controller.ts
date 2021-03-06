import { WGResponse, SimpleHandler } from '@/http/RequestHandler'
import { UserDoc } from '@@/migrate/schemas/user'
import url from 'url'

export default class OAuth2Controller {
  public static isSignedIn(): SimpleHandler {
    return (req, res): WGResponse => {
      return res.status(200).json({
        isSignedIn: req.isAuthenticated()
      })
    }
  }

  public static logout(): SimpleHandler {
    return (req, res): WGResponse => {
      req.logOut()

      return res.status(204).json()
    }
  }

  public static googleCallback(): SimpleHandler {
    return async (req, res): Promise<void> => {
      const user = req.user as UserDoc

      if (user.isNew) {
        await user.save()

        return res.redirect(
          url.format({
            pathname: process.env.DOMAIN,
            query: {
              isnew: true
            }
          })
        )
      } else {
        return res.redirect(process.env.DOMAIN)
      }
    }
  }
}
