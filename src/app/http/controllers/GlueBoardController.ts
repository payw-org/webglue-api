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
  }>
}

interface GetResponseBody {
  id: string
  category: {
    name: string
    color: string
  }
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
          category: glueBoard.category
        })
      }

      return res.status(200).json(responseBody)
    }
  }

  public static validateCreate(): ValidationChain[] {
    return checkSchema({
      name: {
        exists: true,
        in: 'body',
        isString: true,
        trim: true,
        custom: {
          // check if category name is already in use
          options: async (name: string, { req }): Promise<void> => {
            const glueBoardIDs = ((req as Request).user as UserDoc).glueBoards

            const exists = await GlueBoard.exists({
              _id: { $in: glueBoardIDs },
              'category.name': name
            })

            if (exists) {
              throw new Error('`name` already in use.')
            }
          }
        },
        errorMessage: '`name` must be a string.'
      },
      color: {
        exists: true,
        in: 'body',
        isHexColor: true,
        trim: true,
        errorMessage: '`color` must be a hex color.'
      }
    })
  }

  /**
   * Create new GlueBoard
   */
  public static create(): SimpleHandler {
    return async (req, res): Promise<Response> => {
      // create a GlueBoard
      const glueBoard = (await GlueBoard.create({
        id: generate('0123456789abcdefghijklmnopqrstuvwxyz', 14), // url id
        category: {
          name: req.body.name,
          color: req.body.color
        }
      })) as GlueBoardDoc

      // Add new GlueBoard to user
      const user = req.user as UserDoc
      user.glueBoards.push(glueBoard._id)
      await user.save()

      return res
        .status(201)
        .location(glueBoard.id)
        .json()
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
        }
      }

      return res.status(200).json(responseBody)
    }
  }
}
