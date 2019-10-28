import request from 'request-promise-native'
import fs from 'fs-extra'
import appRoot from 'app-root-path'
import { JSDOM } from 'jsdom'
import { SimpleHandler, Response } from 'Http/RequestHandler'
import { checkSchema, ValidationChain } from 'express-validator'

interface AssetElementList {
  hrefElements: HTMLLinkElement[]
  srcElements: Array<HTMLImageElement | HTMLScriptElement | HTMLVideoElement>
  styleElements: HTMLStyleElement[]
}

export default class MirroringController {
  private static url: URL

  private static html: JSDOM

  private static assetElements = {} as AssetElementList

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
        this.getAssets()

        return res.status(200).send(this.html.serialize())
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

  private static getAssets(): void {
    const hrefElements = this.html.window.document.querySelectorAll('link')
    const srcElements = [
      this.html.window.document.querySelectorAll('img'),
      this.html.window.document.querySelectorAll('script'),
      this.html.window.document.querySelectorAll('video')
    ]
    const styleElements = this.html.window.document.querySelectorAll('style')

    this.assetElements.hrefElements = []
    this.assetElements.srcElements = []
    this.assetElements.styleElements = []

    // get all stylesheet and preload link elements
    for (let i = 0; i < hrefElements.length; i++) {
      if (
        hrefElements[i].rel === 'stylesheet' ||
        hrefElements[i].rel === 'preload'
      ) {
        if (hrefElements[i].href) {
          this.assetElements.hrefElements.push(hrefElements[i])
        }
      }
    }

    // get all src elements
    for (const tagElements of srcElements) {
      for (let i = 0; i < tagElements.length; i++) {
        if (tagElements[i].src) {
          this.assetElements.srcElements.push(tagElements[i])
        }
      }
    }

    const styleURLRegex = /(url\()/
    for (let i = 0; i < styleElements.length; i++) {
      if (styleURLRegex.test(styleElements[i].textContent)) {
        this.assetElements.styleElements.push(styleElements[i])
      }
    }
  }
  }
}
