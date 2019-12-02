import LRU from 'lru-cache'
import { JSDOM } from 'jsdom'

type MemoryType = 'snapshot' | 'mirroring'

/**
 * Singleton pattern is applied to this class.
 */
export default class HTMLMemory {
  private static _instance: HTMLMemory
  private snapshotCache: LRU<{}, {}>
  private mirroringCache: LRU<{}, {}>

  /**
   * Get singleton instance
   *
   * @constructor
   */
  public static get Instance(): HTMLMemory {
    if (this._instance === undefined) {
      this._instance = new this()
    }

    return this._instance
  }

  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    // initialize lru cache
    this.snapshotCache = new LRU({
      max: 1610612736, // 1.5 GB
      maxAge: 1000 * 55 // 55 seconds
    })
    this.mirroringCache = new LRU({
      max: 1073741824, // 1 GB
      maxAge: 1000 * 60 // 1 minute
    })
  }

  /**
   * Check whether if the html which is corresponding to key is cached in the specific memory.
   *
   * @param memory
   * @param key
   */
  public isCached(memory: MemoryType, key: string): boolean {
    if (memory === 'snapshot') {
      return this.snapshotCache.has(key)
    } else if (memory === 'mirroring') {
      return this.mirroringCache.has(key)
    }

    return false
  }

  /**
   * Get cached mirrored html as dom
   *
   * @param memory
   * @param key
   */
  public getHTML(memory: MemoryType, key: string): JSDOM {
    if (!this.isCached(memory, key)) {
      return undefined
    }

    if (memory === 'snapshot') {
      return this.snapshotCache.get(key) as JSDOM
    } else if (memory === 'mirroring') {
      return this.mirroringCache.get(key) as JSDOM
    }

    return undefined
  }

  /**
   * Get cached mirrored html as string
   *
   * @param memory
   * @param key
   */
  public getSerializedHTML(memory: MemoryType, key: string): string {
    if (!this.isCached(memory, key)) {
      return undefined
    }

    return this.getHTML(memory, key).serialize()
  }

  /**
   * Cache mirrored html
   *
   * @param memory
   * @param key
   * @param html
   */
  public caching(memory: MemoryType, key: string, html: JSDOM): void {
    if (memory === 'snapshot') {
      this.snapshotCache.set(key, html)
    } else if (memory === 'mirroring') {
      this.mirroringCache.set(key, html)
    }
  }
}
