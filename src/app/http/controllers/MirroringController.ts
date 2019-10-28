import request from 'request-promise-native'
import fs from 'fs-extra'
import appRoot from 'app-root-path'
import { JSDOM } from 'jsdom'
import { SimpleHandler, Response } from 'Http/RequestHandler'
import { checkSchema, ValidationChain } from 'express-validator'

export default class MirroringController {
  private static url: URL

  private static html: JSDOM

  public static validateGetHTML(): ValidationChain[] {
    return checkSchema({
      url: {
        exists: true,
        in: ['body', 'query'],
        isURL: true,
        trim: true,
        customSanitizer: {
          options: (url: string): string => {
            // check if the url protocol is set
            // if not, add the default protocol `http`
            if (!url.startsWith('http')) {
              url = 'http://' + url
            }

            // trim www
            const urlObj = new URL(url)
            if (urlObj.hostname.startsWith('www.')) {
              urlObj.hostname = urlObj.hostname.replace('www.', '')
              url = urlObj.href
            }

            return url
          }
        },
        errorMessage: '`url` must be a url.'
      }
    })
  }

  public static getHTML(): SimpleHandler {
    return async (req, res): Promise<Response | void> => {
      this.url = new URL(req.body.url || req.query.url)

      try {
        await this.downloadHTML()
        const result = this.parseHTML()

        return res.status(200).json({
          result: result
        })
      } catch (err) {
        return res.status(406).json({
          err: {
            msg: err
          }
        })
      }
    }
  }

  private static async downloadHTML(): Promise<void> {
    this.html = new JSDOM(await request(this.url.href))
    const dir = appRoot.path + '/mirrors/' + this.url.hostname

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }

    const wstream = fs.createWriteStream(dir + '/index.html')
    wstream.write(this.html.serialize())
    wstream.end()
  }

  private static parseHTML(): string[] {
    const linkElements = this.html.window.document.querySelectorAll('link')
    const srcTagsElements = [
      this.html.window.document.querySelectorAll('img'),
      this.html.window.document.querySelectorAll('script'),
      this.html.window.document.querySelectorAll('video')
    ]
    const assetLinks = []

    // select all stylesheet href attributes
    for (let i = 0; i < linkElements.length; i++) {
      if (linkElements[i].rel === 'stylesheet') {
        assetLinks.push(linkElements[i].href)
      }
    }

    // select all src attributes
    for (const tagElments of srcTagsElements) {
      for (let i = 0; i < tagElments.length; i++) {
        if (tagElments[i].src) {
          assetLinks.push(tagElments[i].src)
        }
      }
    }

    return assetLinks
  }
}
