import { Response, SimpleHandler } from 'Http/RequestHandler'
import { UserDoc } from '../../../migrate/schemas/user'

interface IndexResponseBody {
  email: string
  nickname: string
  image: string
  name: string
}

export default class MeController {
  /**
   * Get current logged in user info briefly
   */
  public static index(): SimpleHandler {
    return (req, res): Response => {
      const user = req.user as UserDoc
      const responseBody: IndexResponseBody = {
        email: user.email,
        nickname: user.nickname,
        image: user.image,
        name: user.name
      }

      return res.status(200).json(responseBody)
    }
  }
}
