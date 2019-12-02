import { WGRequest, WGResponse, SimpleHandler } from '@/http/RequestHandler'
import { GlueBoardDoc } from '@@/migrate/schemas/glue-board'
import GlueBoard from '@@/migrate/models/glue-board'
import Fragment from '@@/migrate/models/fragment'
import { FragmentDoc, FragmentJSON } from '@@/migrate/schemas/fragment'
import { checkSchema, ValidationChain } from 'express-validator'
import { UserDoc } from '@@/migrate/schemas/user'
import UniformURL from '@/modules/webglue-api/UniformURL'
import UIDGenerator from '@/modules/UIDGenerator'
import Snappy from '@/modules/webglue-api/Snappy'

interface IndexResponseBody {
  fragments: FragmentJSON[]
}

type GetResponseBody = FragmentJSON

interface CreateResponseBody {
  createdID: string
}

export default class FragmentController {
  public static readonly DEFAULT_WATCH_CYCLE = 60

  /**
   * Get all fragments of the GlueBoard.
   */
  public static index(): SimpleHandler {
    return async (req, res): Promise<WGResponse> => {
      // populate fragments
      const glueBoard = (await GlueBoard.findById(res.locals.glueBoard._id, {
        _id: 0,
        fragments: 1
      })
        .lean()
        .populate({
          path: 'fragments',
          select: '-_id -__v -glueBoard'
        })) as GlueBoardDoc

      const fragments = glueBoard.fragments as FragmentDoc[]

      const responseBody: IndexResponseBody = {
        fragments: []
      }

      // compose response body
      for (const fragment of fragments) {
        responseBody.fragments.push(fragment)
      }

      return res.status(200).json(responseBody)
    }
  }

  public static validateCreate(): ValidationChain[] {
    return checkSchema({
      url: {
        exists: true,
        in: 'body',
        isURL: true,
        trim: true,
        customSanitizer: {
          options: async (url: string): Promise<string> => {
            url = encodeURI(url)

            // check if the url protocol is set
            // if not, add the default protocol `http`
            if (!url.startsWith('http')) {
              url = `http://${url}`
            }

            // check if the url is invalid and uniform it
            try {
              url = await UniformURL.uniform(url)
            } catch (error) {
              throw new Error('Invalid target url')
            }

            return url
          }
        },
        errorMessage: '`url` must be a url format.'
      },
      'selector.name': {
        exists: {
          options: { checkFalsy: true }
        },
        in: 'body',
        isString: true,
        trim: true,
        errorMessage: '`selector.name` must be a string.'
      },
      'selector.offset': {
        optional: true,
        in: 'body',
        isInt: {
          options: {
            min: 0
          }
        },
        errorMessage:
          '`selector.offset` must be a integer which is greater than 0'
      },
      xPos: {
        exists: true,
        in: 'body',
        isNumeric: true,
        errorMessage: '`xPos` must be a numeric.'
      },
      yPos: {
        exists: true,
        in: 'body',
        isNumeric: true,
        errorMessage: '`yPos` must be a numeric.'
      },
      scale: {
        optional: true,
        in: 'body',
        isNumeric: true,
        errorMessage: '`scale` must be a numeric.'
      }
    })
  }

  /**
   * Create new fragment.
   */
  public static create(): SimpleHandler {
    return async (req, res): Promise<WGResponse> => {
      // create a fragment
      const fragment = await Fragment.create({
        id: UIDGenerator.alphaNumericUID(16), // url id
        url: await req.body.url,
        selector: req.body.selector,
        xPos: req.body.xPos,
        yPos: req.body.yPos
      })

      // if scale is set, apply to document.
      if (req.body.scale) {
        fragment.scale = req.body.scale
        await fragment.save()
      }

      // add new fragment to GlueBoard
      const glueBoard = res.locals.glueBoard as GlueBoardDoc
      glueBoard.fragments.push(fragment._id)
      await glueBoard.save()

      const responseBody: CreateResponseBody = {
        createdID: fragment.id
      }

      return res.status(201).json(responseBody)
    }
  }

  /**
   * Get the fragment
   */
  public static get(): SimpleHandler {
    return (req, res): WGResponse => {
      const fragment = (res.locals.fragment as FragmentDoc).toJSON()
      delete fragment._id
      delete fragment.__v

      const responseBody: GetResponseBody = fragment

      return res.status(200).json(responseBody)
    }
  }

  public static validateUpdate(): ValidationChain[] {
    return checkSchema({
      xPos: {
        optional: true,
        in: 'body',
        isNumeric: true,
        errorMessage: '`xPos` must be a numeric.'
      },
      yPos: {
        optional: true,
        in: 'body',
        isNumeric: true,
        errorMessage: '`yPos` must be a numeric.'
      },
      scale: {
        optional: true,
        in: 'body',
        isNumeric: true,
        errorMessage: '`scale` must be a numeric.'
      },
      subscription: {
        optional: true,
        in: 'body',
        isBoolean: true,
        errorMessage: '`subscription` must be a boolean.'
      },
      watchCycle: {
        optional: true,
        in: 'body',
        isInt: {
          options: {
            min: 30
          }
        },
        errorMessage:
          '`watchCycle` must be a integer which is greater than equal 30'
      },
      transferGlueBoardID: {
        optional: {
          options: { checkFalsy: true }
        },
        in: 'body',
        isString: true,
        trim: true,
        custom: {
          // check if the GlueBoard id is valid
          options: async (
            transferGlueBoardID: string,
            { req }
          ): Promise<boolean> => {
            const request = req as WGRequest
            const glueBoard = await GlueBoard.findOne(
              { id: transferGlueBoardID },
              { _id: 1 }
            ).lean()

            // check if exist
            if (glueBoard) {
              const userGlueBoardIDs = (request.user as UserDoc).glueBoards
              // check if the GlueBoard is user's own
              if (userGlueBoardIDs.includes(glueBoard._id)) {
                return true
              }
            }

            throw new Error('Invalid `glueBoardID`.')
          }
        },
        errorMessage: '`glueBoard` must be a string.'
      }
    })
  }

  /**
   * Partial update the fragment
   */
  public static update(): SimpleHandler {
    return async (req, res): Promise<WGResponse> => {
      const fragment = res.locals.fragment as FragmentDoc

      // update x position
      if (req.body.xPos !== undefined) {
        fragment.xPos = req.body.xPos
      }

      // update y position
      if (req.body.yPos !== undefined) {
        fragment.yPos = req.body.yPos
      }

      // update scale
      if (req.body.scale) {
        fragment.scale = req.body.scale
      }

      // update subscription
      if (req.body.subscription !== undefined) {
        if (req.body.subscription === true && fragment.subscription === false) {
          // subscribe
          fragment.subscription = true
          fragment.headers.userAgent = req.headers['user-agent']
          fragment.headers.accept = req.headers.accept
          fragment.headers.acceptLanguage = req.headers['accept-language']
          fragment.snapshot = (
            await Snappy.Instance.snapshotElement(
              fragment.url,
              fragment.headers,
              fragment.selector.name,
              fragment.selector.offset
            )
          ).outerHTML
          fragment.watchCycle = this.DEFAULT_WATCH_CYCLE
          fragment.lastWatchedAt = new Date()
        } else if (
          req.body.subscription === false &&
          fragment.subscription === true
        ) {
          // unsubscribe
          fragment.subscription = false
          fragment.headers = undefined
          fragment.snapshot = undefined
          fragment.watchCycle = undefined
          fragment.lastWatchedAt = undefined
        }
      }

      // update watch cycle
      if (req.body.watchCycle) {
        if (fragment.subscription) {
          fragment.watchCycle = req.body.watchCycle
        }
      }

      await fragment.save()

      if (req.body.transferGlueBoardID) {
        const transferGlueBoard = await GlueBoard.findOne({
          id: req.body.transferGlueBoardID
        })
        const currGlueBoard = res.locals.glueBoard as GlueBoardDoc

        // unlink from current GlueBoard
        currGlueBoard.fragments.splice(
          currGlueBoard.fragments.indexOf(fragment._id),
          1
        )
        await currGlueBoard.save()

        // link to new GlueBoard
        transferGlueBoard.fragments.push(fragment._id)
        await transferGlueBoard.save()
      }

      return res.status(204).json()
    }
  }

  /**
   * Delete the fragment
   */
  public static delete(): SimpleHandler {
    return async (req, res): Promise<WGResponse> => {
      const glueBoard = res.locals.glueBoard as GlueBoardDoc
      const fragment = res.locals.fragment as FragmentDoc

      // delete from fragment list of the current GlueBoard
      glueBoard.fragments.splice(glueBoard.fragments.indexOf(fragment._id), 1)
      await glueBoard.save()

      // delete the fragment
      await fragment.remove()

      return res.status(204).json()
    }
  }
}
