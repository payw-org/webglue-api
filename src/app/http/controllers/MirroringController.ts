import { IncomingHttpHeaders } from 'http'
import { JSDOM } from 'jsdom'
import { SimpleHandler, WGResponse } from '@/http/RequestHandler'
import { checkSchema, ValidationChain } from 'express-validator'
import UniformURL from '@/modules/webglue-api/UniformURL'
import MirroringMemory from '@/modules/webglue-api/MirroringMemory'
import Snappy from '@/modules/webglue-api/Snappy'

interface AssetElementList {
  hrefAttrElements: Element[]
  srcAttrElements: Element[]
  srcsetAttrElements: Element[]
  styleAttrElements: Element[]
  styleTagElements: HTMLStyleElement[]
}

export default class MirroringController {
  public static validateGetHTML(): ValidationChain[] {
    return checkSchema({
      url: {
        exists: true,
        in: 'query',
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
        errorMessage: '`url` must be a url.'
      }
    })
  }

  /**
   * Get mirrored html
   */
  public static getHTML(): SimpleHandler {
    return async (req, res): Promise<WGResponse> => {
      // uniform target url
      const targetURL = new URL(
        this.parseTargetURL(
          await req.query.url,
          req.originalUrl.split('?url=')[1]
        )
      )

      // check whether if already cached in memory
      if (MirroringMemory.Instance.isCached(targetURL.href)) {
        return res
          .status(200)
          .send(MirroringMemory.Instance.getSerializedHTML(targetURL.href))
      }

      try {
        // mirroring
        const targetHTML = await this.requestHTML(targetURL, req.headers)
        const assetElements = this.fetchAssetElements(targetHTML)
        this.changeAssetsURL(targetURL, assetElements)

        // caching and return with mirrored html
        MirroringMemory.Instance.caching(targetURL.href, targetHTML)
        return res.status(200).send(targetHTML.serialize())
      } catch (err) {
        return res.status(406).json({
          err: {
            msg: err
          }
        })
      }
    }
  }

  private static parseTargetURL(
    sanitizedURL: string,
    originalURL: string
  ): string {
    const baseURL = sanitizedURL.split('?')[0]
    const query = originalURL.split('?')[1]

    let parsedURL
    if (query === undefined) {
      parsedURL = baseURL
    } else {
      parsedURL = baseURL + '?' + query
    }

    return encodeURI(parsedURL)
  }

  /**
   * Request target html file to host.
   *
   * @param targetURL
   * @param headers
   */
  private static async requestHTML(
    targetURL: URL,
    headers: IncomingHttpHeaders
  ): Promise<JSDOM> {
    // create dom from html
    const targetHTML = await Snappy.Instance.snapshotHTML(targetURL.href, {
      userAgent: headers['user-agent'],
      accept: headers.accept,
      acceptLanguage: headers['accept-language']
    })

    // convert all http to https because http resource load error
    const httpRegex = /(http:\/\/)/gm
    targetHTML.window.document.documentElement.innerHTML = targetHTML.window.document.documentElement.innerHTML.replace(
      httpRegex,
      'https://'
    )

    return targetHTML
  }

  /**
   * Fetch asset elements from target html dom.
   */
  private static fetchAssetElements(targetHTML: JSDOM): AssetElementList {
    const assetElements = {} as AssetElementList

    assetElements.hrefAttrElements = Array.from(
      targetHTML.window.document.querySelectorAll('[href]')
    )

    assetElements.srcAttrElements = Array.from(
      targetHTML.window.document.querySelectorAll('[src]')
    )

    assetElements.srcsetAttrElements = Array.from(
      targetHTML.window.document.querySelectorAll('[srcset]')
    )

    const styleURLRegex = /(url\()/

    assetElements.styleAttrElements = Array.from(
      targetHTML.window.document.querySelectorAll('[style]')
    ).filter(elem => styleURLRegex.test(elem.getAttribute('style')))

    assetElements.styleTagElements = Array.from(
      targetHTML.window.document.querySelectorAll('style')
    ).filter(elem => styleURLRegex.test(elem.textContent))

    return assetElements
  }

  /**
   * Change all assets url to absolute things.
   */
  private static changeAssetsURL(
    targetURL: URL,
    assetElements: AssetElementList
  ): void {
    // convert all relative path to absolute path
    for (const hrefElement of assetElements.hrefAttrElements) {
      hrefElement.setAttribute(
        'href',
        this.getAbsolutePath(targetURL, hrefElement.getAttribute('href'))
      )
    }

    for (const srcElement of assetElements.srcAttrElements) {
      srcElement.setAttribute(
        'src',
        this.getAbsolutePath(targetURL, srcElement.getAttribute('src'))
      )
    }

    for (const srcsetElement of assetElements.srcsetAttrElements) {
      const newSrcset = srcsetElement
        .getAttribute('srcset')
        .split(',')
        .map(src => {
          src = src.trimLeft()

          const srcTokens = src.split(' ')
          srcTokens[0] = this.getAbsolutePath(targetURL, srcTokens[0])

          src = srcTokens.join(' ')

          return src
        })
        .join(',')
      srcsetElement.setAttribute('srcset', newSrcset)
    }

    const stylePathRegex = /url\(['"]?([^'"()]+?)['"]?\)/gm

    for (const styleAttrElement of assetElements.styleAttrElements) {
      styleAttrElement.setAttribute(
        'style',
        styleAttrElement
          .getAttribute('style')
          .replace(stylePathRegex, substring => {
            return this.stylePathReplacer(targetURL, substring)
          })
      )
    }

    for (const styleTagElement of assetElements.styleTagElements) {
      styleTagElement.innerHTML = styleTagElement.innerHTML.replace(
        stylePathRegex,
        substring => {
          return this.stylePathReplacer(targetURL, substring)
        }
      )
    }
  }

  /**
   * Convert all path to absolute thing.
   *
   * @param targetURL
   * @param path
   */
  private static getAbsolutePath(targetURL: URL, path: string): string {
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
      path = `https://${targetURL.host}${path}`
    } else if (currentPathRegex.test(path)) {
      const currentPaths = targetURL.pathname.split('/').slice(0, -1)
      const assetPaths = path.split('/')
      path = `https://${targetURL.host}${currentPaths
        .concat(assetPaths)
        .join('/')}`
    } else if (parentPathRegex.test(path)) {
      const parentPaths = targetURL.pathname.split('/').slice(0, -2)
      const assetPaths = path.split('/').slice(1)
      path = `https://${targetURL.host}${parentPaths
        .concat(assetPaths)
        .join('/')}`
    }

    return path
  }

  /**
   * Handle the specific case: style path.
   * Format: `url(path)`
   *
   * @param targetURL
   * @param stylePath
   */
  private static stylePathReplacer(targetURL: URL, stylePath: string): string {
    const stylePathRegex = /url\(['"]?([^'"()]+?)['"]?\)/gm

    const extractedURL = new RegExp(stylePathRegex).exec(stylePath)
    const absolutePath = this.getAbsolutePath(targetURL, extractedURL[1])

    if (stylePath.startsWith('url("')) {
      stylePath = `url("${absolutePath}")`
    } else if (stylePath.startsWith("url('")) {
      stylePath = `url('${absolutePath}')`
    } else {
      stylePath = `url(${absolutePath})`
    }

    return stylePath
  }
}
