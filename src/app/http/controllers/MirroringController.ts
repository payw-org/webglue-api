import request from 'request-promise-native'
import fs from 'fs-extra'
import iconv from 'iconv-lite'
import charset from 'charset'
import appRoot from 'app-root-path'
import { JSDOM } from 'jsdom'
import { SimpleHandler, Request, Response } from 'Http/RequestHandler'
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

  /**
   * Get mirrored html
   */
  public static getHTML(): SimpleHandler {
    return async (req, res): Promise<Response> => {
      this.url = new URL(req.body.url || req.query.url)

      try {
        await this.requestHTML(req)
        this.fetchAssetElements()
        this.changeAssetsURL()
        this.createMirroredHTMLFile()

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

  private static async requestHTML(req: Request): Promise<void> {
    let originalHTML

    // get html body
    await request(
      {
        url: this.url.href,
        encoding: null,
        followOriginalHttpMethod: true,
        headers: {
          'User-Agent': req.headers['user-agent'],
          Accept: req.headers.accept,
          'Accept-Language': req.headers['accept-language']
        }
      },
      (error, res, body) => {
        if (!error) {
          // update protocol and hostname to actual things
          this.url.protocol = res.request.uri.protocol
          this.url.hostname = res.request.uri.hostname
          originalHTML = iconv.decode(body, charset(res.headers, body)) // decode the html according to its charset
        } else {
          throw error
        }
      }
    )

    this.html = new JSDOM(originalHTML) // create dom from html

    // convert all http to https because http resource load error
    const httpRegex = /(http:\/\/)/g
    this.html.window.document.documentElement.innerHTML = this.html.window.document.documentElement.innerHTML.replace(
      httpRegex,
      'https://'
    )
  }

  private static fetchAssetElements(): void {
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

    let i
    // get all stylesheet and preload link elements
    for (i = 0; i < hrefElements.length; i++) {
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
      for (i = 0; i < tagElements.length; i++) {
        if (tagElements[i].src) {
          this.assetElements.srcElements.push(tagElements[i])
        }
      }
    }

    const styleURLRegex = /(url\()/
    for (i = 0; i < styleElements.length; i++) {
      if (styleURLRegex.test(styleElements[i].textContent)) {
        this.assetElements.styleElements.push(styleElements[i])
      }
    }
  }

  private static changeAssetsURL(): void {
    // convert all relative path to absolute path
    const hostnameRegex = /^(http|https|https:\/\/|http:\/\/)?([?a-zA-Z0-9-.+]{2,256}\.[a-z]{2,4}\b)/
    for (const hrefElement of this.assetElements.hrefElements) {
      if (!hostnameRegex.test(hrefElement.href)) {
        hrefElement.setAttribute(
          'href',
          'https://' + this.url.hostname + hrefElement.href
        )
      }
    }

    for (const srcElement of this.assetElements.srcElements) {
      if (
        !hostnameRegex.test(srcElement.src) &&
        !srcElement.src.startsWith('data:')
      ) {
        srcElement.setAttribute(
          'src',
          'https://' + this.url.hostname + srcElement.src
        )
      }
    }

    const stylePathRegex = /(url\(\/)/gm
    for (const styleElement of this.assetElements.styleElements) {
      styleElement.innerHTML = styleElement.innerHTML.replace(
        stylePathRegex,
        'url(https://' + this.url.hostname + '/'
      )
    }
  }

  private static createMirroredHTMLFile(): void {
    const dir = appRoot.path + '/mirrors/' + this.url.hostname

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
    }

    const wstream = fs.createWriteStream(dir + '/index.html')
    wstream.write(this.html.serialize())
    wstream.end()
  }
}
