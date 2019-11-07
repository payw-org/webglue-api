import { Response, SimpleHandler } from '@/http/RequestHandler'
import { GlueBoardDoc } from '@@/migrate/schemas/glue-board'
import GlueBoard from '@@/migrate/models/glue-board'
import { FragmentDoc } from '@@/migrate/schemas/fragment'
import Fragment from '@@/migrate/models/fragment'
import generate from 'nanoid/generate'
import { checkSchema, ValidationChain } from 'express-validator'

interface IndexResponseBody {
  fragments: Array<{
    id: string
    url: string
    selector: string
    xPos: number
    yPos: number
    scale: number
  }>
}

interface GetResponseBody {
  id: string
  url: string
  selector: string
  xPos: number
  yPos: number
  scale: number
}

export default class FragmentController {
  /**
   * Get all fragments of the GlueBoard.
   */
  public static index(): SimpleHandler {
    return async (req, res): Promise<Response> => {
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
        errorMessage: '`url` must be a url format.'
      },
      selector: {
        exists: true,
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
    return async (req, res): Promise<Response> => {
      // create a fragment
      const fragment = (await Fragment.create({
        id: generate('0123456789abcdefghijklmnopqrstuvwxyz', 16), // url id
        url: req.body.url,
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

      return res
        .status(201)
        .location(req.originalUrl + '/' + fragment.id)
        .json()
    }
  }

  /**
   * Get the fragment
   */
  public static get(): SimpleHandler {
    return (req, res): Response => {
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
      }
    })
  }

  /**
   * Partial update the fragment
   */
  public static update(): SimpleHandler {
    return async (req, res): Promise<Response> => {
      const fragment = res.locals.fragment as FragmentDoc

      // update x position
      if (req.body.xPos) {
        fragment.xPos = req.body.xPos
      }

      // update y position
      if (req.body.yPos) {
        fragment.yPos = req.body.yPos
      }

      // update scale
      if (req.body.scale) {
        fragment.scale = req.body.scale
      }

      await fragment.save()

      return res.status(204).json()
    }
  }

  /**
   * Delete the fragment
   */
  public static delete(): SimpleHandler {
    return async (req, res): Promise<Response> => {
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
