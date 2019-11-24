import request from 'request-promise-native'
import iconv from 'iconv-lite'
import charset from 'charset'
import { JSDOM } from 'jsdom'

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
    let html = ''
    await request(
      {
        url: url,
        encoding: null,
        followOriginalHttpMethod: true,
        headers: headers
      },
      (error, response, body) => {
        if (!error) {
          html = iconv.decode(body, charset(response.headers, body)) // decode the html according to its charset
        } else {
          throw error
        }
      }
    )

    return new JSDOM(html)
  }

  /**
   * Snapshot the specific url's html element.
   *
   * @param url
   * @param headers
   * @param selector
   */
  public async snapshotElement(
    url: string,
    headers: UserHeaders,
    selector: string
  ): Promise<Element> {
    const html = await this.snapshotHTML(url, headers)

    return html.window.document.querySelector(selector)
  }
}
