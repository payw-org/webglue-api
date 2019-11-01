import request from 'request-promise-native'
import fs from 'fs-extra'
import iconv from 'iconv-lite'
import charset from 'charset'
import appRoot from 'app-root-path'
import { JSDOM } from 'jsdom'
import { SimpleHandler, Request, Response } from 'Http/RequestHandler'
import { checkSchema, ValidationChain } from 'express-validator'

interface AssetElementList {
  hrefAttrElements: Element[]
  srcAttrElements: Element[]
  srcsetAttrElements: Element[]
  styleAttrElements: Element[]
  styleTagElements: HTMLStyleElement[]
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
          this.url.href = res.request.uri.href // update to actual href
          originalHTML = iconv.decode(body, charset(res.headers, body)) // decode the html according to its charset
        } else {
          throw error
        }
      }
    )

    this.html = new JSDOM(originalHTML) // create dom from html

    // convert all http to https because http resource load error
    const httpRegex = /(http:\/\/)/gm
    this.html.window.document.documentElement.innerHTML = this.html.window.document.documentElement.innerHTML.replace(
      httpRegex,
      'https://'
    )
  }

  private static fetchAssetElements(): void {
    this.assetElements.hrefAttrElements = Array.from(
      this.html.window.document.querySelectorAll('[href]')
    )

    this.assetElements.srcAttrElements = Array.from(
      this.html.window.document.querySelectorAll('[src]')
    )

    this.assetElements.srcsetAttrElements = Array.from(
      this.html.window.document.querySelectorAll('[srcset]')
    )

    const styleURLRegex = /(url\()/

    this.assetElements.styleAttrElements = Array.from(
      this.html.window.document.querySelectorAll('[style]')
    ).filter(elem => styleURLRegex.test(elem.getAttribute('style')))

    this.assetElements.styleTagElements = Array.from(
      this.html.window.document.querySelectorAll('style')
    ).filter(elem => styleURLRegex.test(elem.textContent))
  }

  private static changeAssetsURL(): void {
    // convert all relative path to absolute path
    for (const hrefElement of this.assetElements.hrefAttrElements) {
      hrefElement.setAttribute(
        'href',
        this.getAbsolutePath(hrefElement.getAttribute('href'))
      )
    }

    for (const srcElement of this.assetElements.srcAttrElements) {
      srcElement.setAttribute(
        'src',
        this.getAbsolutePath(srcElement.getAttribute('src'))
      )
    }

    for (const srcsetElement of this.assetElements.srcsetAttrElements) {
      const newSrcset = srcsetElement
        .getAttribute('srcset')
        .split(',')
        .map(src => {
          src = src.trimLeft()

          const srcTokens = src.split(' ')
          srcTokens[0] = this.getAbsolutePath(srcTokens[0])

          src = srcTokens.join(' ')

          return src
        })
        .join(',')
      srcsetElement.setAttribute('srcset', newSrcset)
    }

    const stylePathRegex = /url\(['"]?([^'"()]+?)['"]?\)/gm

    for (const styleAttrElement of this.assetElements.styleAttrElements) {
      styleAttrElement.setAttribute(
        'style',
        styleAttrElement
          .getAttribute('style')
          .replace(stylePathRegex, substring => {
            return this.stylePathReplacer(substring)
          })
      )
    }

    for (const styleTagElement of this.assetElements.styleTagElements) {
      styleTagElement.innerHTML = styleTagElement.innerHTML.replace(
        stylePathRegex,
        substring => {
          return this.stylePathReplacer(substring)
        }
      )
    }
  }

  private static getAbsolutePath(path: string): string {
    /**
     * root path: /foo/bar
     * current path: foo/bar
     * parent path: ../foo/bar
     */
    const rootPathRegex = /^\/(([A-z0-9\-%._~()'!*:@,;+&=?#]+\/)*[A-z0-9\-%._~()'!*:@,;+&=?#]*$)?$/
    const currentPathRegex = /^(?!data:)(?!javascript:)(([A-z0-9\-%._~()'!*:@,;+&=?#]+\/)*[A-z0-9\-%._~()'!*:@,;+&=?#]*$)?$/
    const parentPathRegex = /^\.\.\/(([A-z0-9\-%._~()'!*:@,;+&=?#]+\/)*[A-z0-9\-%._~()'!*:@,;+&=?#]*$)?$/
    // const hostnameRegex = /^(http|https|https:\/\/|http:\/\/)?([?a-zA-Z0-9-.+]{2,256}\.[a-z]{2,4}\b)/

    if (rootPathRegex.test(path)) {
      path = 'https://' + this.url.host + path
    } else if (currentPathRegex.test(path)) {
      const currentPaths = this.url.pathname.split('/').slice(0, -1)
      const assetPaths = path.split('/')
      path =
        'https://' + this.url.host + currentPaths.concat(assetPaths).join('/')
    } else if (parentPathRegex.test(path)) {
      const parentPaths = this.url.pathname.split('/').slice(0, -2)
      const assetPaths = path.split('/').slice(1)
      path =
        'https://' + this.url.host + parentPaths.concat(assetPaths).join('/')
    }

    return path
  }

  private static stylePathReplacer(stylePath: string): string {
    const stylePathRegex = /url\(['"]?([^'"()]+?)['"]?\)/gm

    const extractedURL = new RegExp(stylePathRegex).exec(stylePath)
    const absolutePath = this.getAbsolutePath(extractedURL[1])

    if (stylePath.startsWith('url("')) {
      stylePath = 'url("' + absolutePath + '")'
    } else if (stylePath.startsWith("url('")) {
      stylePath = "url('" + absolutePath + "')"
    } else {
      stylePath = 'url(' + absolutePath + ')'
    }

    return stylePath
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
