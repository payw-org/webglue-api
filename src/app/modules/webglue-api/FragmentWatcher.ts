import { FragmentDoc } from '@@/migrate/schemas/fragment'
import Fragment from '@@/migrate/models/fragment'
import moment from 'moment'
import pLimit from 'p-limit'
import Snappy from '@/modules/webglue-api/Snappy'
import { JSDOM } from 'jsdom'

export default class FragmentWatcher {
  private static _instance: FragmentWatcher

  /**
   * Get singleton instance
   *
   * @constructor
   */
  public static get Instance(): FragmentWatcher {
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
   * Main logic for fragment watcher.
   * It detect if fragment is changed,
   * and publish event to fragment notifier who is subscriber for this class.
   */
  public async watch(): Promise<void> {
    const fragmentsToWatch = await this.getAllFragmentsToWatch()
    const snapshots = await this.takeSnapshots(fragmentsToWatch)

    // change detection
    for (let i = 0; i < fragmentsToWatch.length; i++) {
      // extract contents
      const prevContents = new JSDOM(fragmentsToWatch[i].snapshot).window
        .document.body.firstElementChild.textContent
      const currContents = snapshots[i].textContent

      // changed
      if (prevContents !== currContents) {
        fragmentsToWatch[i].snapshot = snapshots[i].outerHTML
        // @TODO: publish to notifier
      }

      // update last watched date
      fragmentsToWatch[i].lastWatchedAt = new Date()

      await fragmentsToWatch[i].save()
    }
  }

  private async getAllFragmentsToWatch(): Promise<FragmentDoc[]> {
    // get all subscribers
    const subscribers = await Fragment.find(
      { subscription: true },
      { _id: 1, watchCycle: 1, lastWatchedAt: 1 }
    ).lean()

    // filter subscribers which are time to watch
    const watchList = subscribers.filter((subscriber: FragmentDoc) => {
      return (
        subscriber.lastWatchedAt <=
        moment()
          .subtract(subscriber.watchCycle, 'minute')
          .toDate()
      )
    })

    return Fragment.find(
      {
        _id: { $in: watchList.map(subscriber => subscriber._id) }
      },
      {
        glueBoard: 1,
        url: 1,
        selector: 1,
        headers: 1,
        snapshot: 1,
        lastWatchedAt: 1
      }
    ).populate({
      path: 'glueBoard',
      select: 'user -_id'
    })
  }

  /**
   * Take the fragment snapshots concurrently.
   *
   * @param fragments
   */
  private async takeSnapshots(fragments: FragmentDoc[]): Promise<Element[]> {
    const promiseLimiter = pLimit(3) // run 3 snapshot promise at once

    const snapshotPromiseList: Promise<Element>[] = []
    for (const fragment of fragments) {
      snapshotPromiseList.push(
        promiseLimiter(() =>
          Snappy.Instance.snapshotElement(
            fragment.url,
            fragment.headers,
            fragment.selector.name,
            fragment.selector.offset
          )
        )
      )
    }

    return Promise.all(snapshotPromiseList)
  }
}
