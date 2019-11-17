import { Request, Response, SimpleHandler } from '@/http/RequestHandler'
import { UserDoc } from '@@/migrate/schemas/user'
import User from '@@/migrate/models/user'
import { GlueBoardDoc } from '@@/migrate/schemas/glue-board'
import { checkSchema, ValidationChain } from 'express-validator'
import GlueBoard from '@@/migrate/models/glue-board'
import generate from 'nanoid/generate'

interface IndexResponseBody {
  glueBoards: Array<{
    id: string
    category: {
      name: string
      color: string
    }
    sharing: boolean
  }>
}

interface GetResponseBody {
  id: string
  category: {
    name: string
    color: string
  }
  sharing: boolean
}

interface CreateResponseBody {
  createdID: string
}

export default class GlueBoardController {
  /**
   * Get user's all GlueBoards
   */
  public static index(): SimpleHandler {
    return async (req, res): Promise<Response> => {
      // populate GlueBoards
      const user = (await User.findById((req.user as UserDoc)._id, {
        _id: 0,
        glueBoards: 1
      })
        .lean()
        .populate({
          path: 'glueBoards',
          select: '-_id -category._id'
        })) as UserDoc

      const glueBoards = user.glueBoards as GlueBoardDoc[]

      const responseBody: IndexResponseBody = {
        glueBoards: []
      }

      // compose response body
      for (const glueBoard of glueBoards) {
        responseBody.glueBoards.push({
          id: glueBoard.id,
          category: glueBoard.category,
          sharing: glueBoard.sharing
        })
      }

      return res.status(200).json(responseBody)
    }
  }

  public static validateCreate(): ValidationChain[] {
    return checkSchema({
      name: {
        exists: {
          options: { checkFalsy: true }
        },
        in: 'body',
        isString: true,
        trim: true,
        custom: {
          // check if category name is already in use
          options: async (name: string, { req }): Promise<boolean> => {
            const glueBoardIDs = ((req as Request).user as UserDoc).glueBoards

            const exists = await GlueBoard.exists({
              _id: { $in: glueBoardIDs },
              'category.name': { $regex: new RegExp('^' + name + '$', 'i') } // compare case insensitive
            })

            if (exists) {
              throw new Error('`name` already in use.')
            }

            return true
          }
        },
        errorMessage: '`name` must be a string.'
      },
      color: {
        exists: true,
        in: 'body',
        isHexColor: true,
        trim: true,
        customSanitizer: {
          // convert color code to uppercase
          options: (value: string): string => {
            return value.toUpperCase()
          }
        },
        errorMessage: '`color` must be a hex color.'
      }
    })
  }

  /**
   * Create new GlueBoard
   */
  public static create(): SimpleHandler {
    return async (req, res): Promise<Response> => {
      const user = req.user as UserDoc

      // create a GlueBoard
      const glueBoard = (await GlueBoard.create({
        user: user._id,
        id: generate('0123456789abcdefghijklmnopqrstuvwxyz', 14), // url id
        category: {
          name: req.body.name,
          color: req.body.color
        }
      })) as GlueBoardDoc

      // Add new GlueBoard to user
      user.glueBoards.push(glueBoard._id)
      await user.save()

      const responseBody: CreateResponseBody = {
        createdID: glueBoard.id
      }

      return res.status(201).json(responseBody)
    }
  }

  /**
   * Get the GlueBoard
   */
  public static get(): SimpleHandler {
    return (req, res): Response => {
      const glueBoard = res.locals.glueBoard as GlueBoardDoc

      const responseBody: GetResponseBody = {
        id: glueBoard.id,
        category: {
          name: glueBoard.category.name,
          color: glueBoard.category.color
        },
        sharing: glueBoard.sharing
      }

      return res.status(200).json(responseBody)
    }
  }

  public static validateUpdate(): ValidationChain[] {
    return checkSchema({
      name: {
        optional: {
          options: { checkFalsy: true }
        },
        in: 'body',
        isString: true,
        trim: true,
        custom: {
          // check if category name is already in use
          // if update to same name, pass to handler
          options: async (name: string, { req }): Promise<boolean> => {
            const request = req as Request
            const glueBoardIDs = (request.user as UserDoc).glueBoards

            const duplicateGlueBoard = (await GlueBoard.findOne(
              {
                _id: { $in: glueBoardIDs },
                'category.name': { $regex: new RegExp('^' + name + '$', 'i') }
              },
              { id: 1 }
            ).lean()) as GlueBoardDoc

            if (duplicateGlueBoard) {
              // if name is already in use from other GlueBoard
              if (duplicateGlueBoard.id !== request.params.glueboard) {
                throw new Error('`name` already in use.')
              }
            }

            return true
          }
        },
        errorMessage: '`name` must be a string.'
      },
      color: {
        optional: true,
        in: 'body',
        isHexColor: true,
        trim: true,
        customSanitizer: {
          options: (value: string): string => {
            return value.toUpperCase()
          }
        },
        errorMessage: '`color` must be a hex color.'
      },
      sharing: {
        optional: true,
        in: 'body',
        isBoolean: true,
        errorMessage: '`sharing` must be a boolean.'
      },
      position: {
        optional: true,
        in: 'body',
        isInt: true,
        custom: {
          // check if the new position is valid
          options: (position: number, { req }): boolean => {
            const glueBoardCount = ((req as Request).user as UserDoc).glueBoards
              .length

            if (position < 0 || position >= glueBoardCount) {
              throw new Error('Invalid scope for `position`')
            }

            return true
          }
        },
        errorMessage: '`position` must be a integer.'
      }
    })
  }

  /**
   * Partial update the GlueBoard.
   */
  public static update(): SimpleHandler {
    return async (req, res): Promise<Response> => {
      const glueBoard = res.locals.glueBoard as GlueBoardDoc

      // update category name
      if (req.body.name) {
        glueBoard.category.name = req.body.name
      }

      // update category color
      if (req.body.color) {
        glueBoard.category.color = req.body.color
      }

      // update sharing option
      if (req.body.sharing !== undefined) {
        glueBoard.sharing = req.body.sharing
      }

      await glueBoard.save()

      // update relative position in the GlueBoard list
      if (req.body.position !== undefined) {
        const user = req.user as UserDoc
        const newPosition = req.body.position
        const currPosition = user.glueBoards.indexOf(glueBoard._id)

        user.glueBoards.splice(currPosition, 1)
        user.glueBoards.splice(newPosition, 0, glueBoard._id)

        await user.save()
      }

      return res.status(204).json()
    }
  }

  /**
   * Delete the GlueBoard
   */
  public static delete(): SimpleHandler {
    return async (req, res): Promise<Response> => {
      const user = req.user as UserDoc
      const glueBoard = res.locals.glueBoard as GlueBoardDoc

      // delete from user's GlueBoard list
      user.glueBoards.splice(user.glueBoards.indexOf(glueBoard._id), 1)
      await user.save()

      // delete the GlueBoard
      await glueBoard.remove()

      return res.status(204).json()
    }
  }
}
