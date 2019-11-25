import { WGRequest, WGResponse, SimpleHandler } from '@/http/RequestHandler'
import { GlueBoardDoc } from '@@/migrate/schemas/glue-board'
import GlueBoard from '@@/migrate/models/glue-board'
import Fragment from '@@/migrate/models/fragment'
import { FragmentDoc, FragmentJSON } from '@@/migrate/schemas/fragment'
import { checkSchema, ValidationChain } from 'express-validator'
import { UserDoc } from '@@/migrate/schemas/user'
import UniformURL from '@/modules/webglue-api/UniformURL'
import UIDGenerator from '@/modules/UIDGenerator'

interface IndexResponseBody {
  fragments: FragmentJSON[]
}

type GetResponseBody = FragmentJSON

interface CreateResponseBody {
  createdID: string
}

export default class FragmentController {
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
          path: 'fragments'
        })) as GlueBoardDoc

      const fragments = glueBoard.fragments as FragmentDoc[]

      const responseBody: IndexResponseBody = {
        fragments: []
      }

      // compose response body
      for (const fragment of fragments) {
        responseBody.fragments.push({
          id: fragment.id,
          url: fragment.url,
          selector: fragment.selector,
          xPos: fragment.xPos,
          yPos: fragment.yPos,
          scale: fragment.scale
        })
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
      selector: {
        exists: {
          options: { checkFalsy: true }
        },
        in: 'body',
        isString: true,
        trim: true,
        errorMessage: '`selector` must be a string.'
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
      const fragment = (await Fragment.create({
        id: UIDGenerator.alphaNumericUID(16), // url id
        url: await req.body.url,
        selector: req.body.selector,
        xPos: req.body.xPos,
        yPos: req.body.yPos
      })) as FragmentDoc

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
      const fragment = res.locals.fragment as FragmentDoc

      const responseBody: GetResponseBody = {
        id: fragment.id,
        url: fragment.url,
        selector: fragment.selector,
        xPos: fragment.xPos,
        yPos: fragment.yPos,
        scale: fragment.scale
      }

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

      await fragment.save()

      if (req.body.transferGlueBoardID) {
        const transferGlueBoard = (await GlueBoard.findOne({
          id: req.body.transferGlueBoardID
        })) as GlueBoardDoc
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
