import { SimpleHandler } from 'Http/RequestHandler'
import { UserDoc } from 'Migrate/schemas/user'
import url from 'url'

export default class OAuth2Controller {
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
