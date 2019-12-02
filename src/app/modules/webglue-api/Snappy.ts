import request from 'request-promise-native'
import iconv from 'iconv-lite'
import charset from 'charset'
import { JSDOM } from 'jsdom'
import HTMLMemory from '@/modules/webglue-api/HTMLMemory'

interface UserHeaders {
  userAgent: string
  accept: string
  acceptLanguage: string
}

export default class Snappy {
  private static _instance: Snappy

  /**
   * Get singleton instance
   *
   * @constructor
   */
  public static get Instance(): Snappy {
    if (this._instance === undefined) {
      this._instance = new this()
    }

    return this._instance
  }

  /**
   * Private constructor for singleton pattern
   */
  // eslint-disable-next-line no-useless-constructor,@typescript-eslint/no-empty-function
  private constructor() {}

  /**
   * Snapshot the specific url's html.
   *
   * @param url
   * @param headers
   */
  public async snapshotHTML(url: string, headers: UserHeaders): Promise<JSDOM> {
    // check whether if already cached in memory
    if (HTMLMemory.Instance.isCached('snapshot', url)) {
      return HTMLMemory.Instance.getHTML('snapshot', url)
    }

    let html = null
    await request(
      {
        url: url,
        encoding: null,
        followOriginalHttpMethod: true,
        headers: {
          'User-Agent': headers.userAgent,
          Accept: headers.accept,
          'Accept-Language': headers.acceptLanguage
        }
      },
      (error, response, body) => {
        if (!error) {
          // decode the html according to its charset
          html = new JSDOM(iconv.decode(body, charset(response.headers, body)))
        } else {
          throw error
        }
      }
    )

    // caching
    HTMLMemory.Instance.caching('snapshot', url, html)

    return html
  }

  /**
   * Snapshot the specific url's html element.
   *
   * @param url
   * @param headers
   * @param selector
   * @param index
   */
  public async snapshotElement(
    url: string,
    headers: UserHeaders,
    selector: string,
    index: number
  ): Promise<Element> {
    const html = await this.snapshotHTML(url, headers)

    return html.window.document.querySelectorAll(selector)[index]
  }
}
