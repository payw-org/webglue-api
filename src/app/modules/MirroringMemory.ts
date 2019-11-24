import LRU from 'lru-cache'
import { JSDOM } from 'jsdom'

/**
 * Singleton pattern is applied to this class.
 */
export default class MirroringMemory {
  private static _instance: MirroringMemory
  private cache: LRU<{}, {}>

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    // initialize lru cache
    this.cache = new LRU({
      max: 1073741824, // 1GB
      maxAge: 1000 * 60 // 1 minute
    })
  }

  /**
   * Get singleton instance
   *
   * @constructor
   */
  public static get Instance(): MirroringMemory {
    if (this._instance === undefined) {
      this._instance = new this()
    }

    return this._instance
  }

  /**
   * Check whether if the mirrored html which is corresponding to key is cached
   *
   * @param key
   */
  public isCached(key: string): boolean {
    return this.cache.has(key)
  }

  /**
   * Get cached mirrored html as dom
   *
   * @param key
   */
  public getHTML(key: string): JSDOM {
    if (!this.isCached(key)) {
      return undefined
    }

    return this.cache.get(key) as JSDOM
  }

  /**
   * Get cached mirrored html as string
   *
   * @param key
   */
  public getSerializedHTML(key: string): string {
    if (!this.isCached(key)) {
      return undefined
    }

    return this.getHTML(key).serialize()
  }

  /**
   * Cache mirrored html
   *
   * @param key
   * @param html
   */
  public caching(key: string, html: JSDOM): void {
    this.cache.set(key, html)
  }
}
