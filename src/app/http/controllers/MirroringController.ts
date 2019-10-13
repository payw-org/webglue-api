import request from 'request-promise-native'
import fs from 'fs'
import appRoot from 'app-root-path'
import { SimpleHandler, Response } from 'Http/RequestHandler'
import { checkSchema, ValidationChain } from 'express-validator'

export default class MirroringController {
  public static validateGetHTML(): ValidationChain[] {
    return checkSchema({
      url: {
        exists: true,
        in: 'query',
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
    return async (req, res): Promise<Response> => {
      const url = new URL(req.query.url)

      try {
        await this.downloadHTML(url)

        return res.status(200).json()
      } catch (err) {
        return res.status(406).json({
          err: {
            msg: err
          }
        })
      }
    }
  }

  private static async downloadHTML(url: URL): Promise<void> {
    const html = await request(url.href)

    const dir = appRoot.path + '/mirrors/' + url.hostname
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }

    const wstream = fs.createWriteStream(dir + '/index.html')
    wstream.write(html)
    wstream.end()
  }
}
