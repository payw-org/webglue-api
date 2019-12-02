import puppeteer, { Browser } from 'puppeteer'

export default class BrowserHandler {
  private static _instance: BrowserHandler

  private _browser: Browser

  /**
   * Get singleton instance
   *
   * @constructor
   */
  public static get Instance(): BrowserHandler {
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

  public async turnOn(): Promise<void> {
    this._browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
  }

  public async turnOff(): Promise<void> {
    await this._browser.close()
  }

  public get browser(): Browser {
    return this._browser
  }
}
