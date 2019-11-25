import { WGRequest, WGResponse, SimpleHandler } from '@/http/RequestHandler'
import { UserDoc, UserJSON } from '@@/migrate/schemas/user'
import { checkSchema, ValidationChain } from 'express-validator'
import User from '@@/migrate/models/user'

type IndexResponseBody = UserJSON

export default class ProfileController {
  /**
   * Get current logged in user info briefly
   */
  public static index(): SimpleHandler {
    return (req, res): WGResponse => {
      const user = (req.user as UserDoc).toJSON()
      delete user._id
      delete user.__v
      delete user.googleId
      delete user.loggedInAt
      delete user.glueBoards

      const responseBody: IndexResponseBody = user

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
        isLength: { options: { min: 2, max: 20 } },
        trim: true,
        escape: true,
        custom: {
          // check if nickname is already in use
          options: async (nickname: string, { req }): Promise<boolean> => {
            const duplicateUser = await User.findOne(
              {
                nickname: { $regex: new RegExp('^' + nickname + '$', 'i') } // compare case insensitive
              },
              { _id: 1 }
            ).lean()

            if (duplicateUser) {
              // if nickname is already in use from other user
              if (
                duplicateUser._id.toString() !==
                ((req as WGRequest).user as UserDoc)._id.toString()
              ) {
                throw new Error('`nickname` already in use.')
              }
            }

            return true
          }
        },
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
        isLength: { options: { min: 2, max: 20 } },
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
    return async (req, res): Promise<WGResponse> => {
      const user = req.user as UserDoc

      // update nickname
      if (req.body.nickname) {
        user.nickname = req.body.nickname
      }

      // update image
      if (req.body.image) {
        user.image = req.body.image
      }

      // update name
      if (req.body.name) {
        user.name = req.body.name
      }

      await user.save()

      return res.status(204).json()
    }
  }
}
