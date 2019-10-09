import { Response, SimpleHandler } from 'Http/RequestHandler'
import { UserDoc } from '../../../migrate/schemas/user'

interface IndexResponseBody {
  nickname: string
  image: string
  name: string
  new: boolean
}

export default class MeController {
  /**
   * Get current logged in user info briefly
   */
  public static index(): SimpleHandler {
    return (req, res): Response => {
      const user = req.user as UserDoc

      let nickname, isNew
      if (!user.nickname) {
        isNew = true
        nickname = user.email.split('@')[0] // set default nickname
      } else {
        isNew = false
        nickname = user.nickname
      }

      const responseBody: IndexResponseBody = {
        nickname: nickname,
        image: user.image,
        name: user.name,
        new: isNew
      }

      return res.status(200).json(responseBody)
    }
  }
}
