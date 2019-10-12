import { Response, SimpleHandler } from 'Http/RequestHandler'
import { UserDoc } from '../../../migrate/schemas/user'
import { checkSchema, ValidationChain } from 'express-validator'

interface IndexResponseBody {
  email: string
  nickname: string
  image: string
  name: string
}

export default class ProfileController {
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

  /**
   * Validate update request.
   */
  public static validateUpdate(): ValidationChain[] {
    return checkSchema({
      nickname: {
        optional: true,
        in: 'body',
        isString: true,
        trim: true,
        escape: true,
        errorMessage: '`nickname` must be a string.'
      },
      image: {
        optional: true,
        in: 'body',
        isURL: true,
        trim: true,
        errorMessage: '`image` must be a url.'
      },
      name: {
        optional: true,
        in: 'body',
        isString: true,
        trim: true,
        escape: true,
        errorMessage: '`name` must be a string.'
      }
    })
  }

  /**
   * Partial update user profile.
   */
  public static update(): SimpleHandler {
    return async (req, res): Promise<Response> => {
      const user = req.user as UserDoc

      // update nickname
      if (req.body.nickname) {
        user.nickname = req.body.nickname
        await user.save()
      }

      // update image
      if (req.body.image) {
        user.image = req.body.image
        await user.save()
      }

      // update name
      if (req.body.name) {
        user.name = req.body.name
        await user.save()
      }

      return res.status(204).json({})
    }
  }
}
