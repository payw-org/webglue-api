import { FragmentDoc } from '@@/migrate/schemas/fragment'
import Fragment from '@@/migrate/models/fragment'
import moment from 'moment'

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
        url: 1,
        selector: 1,
        headers: 1,
        snapshot: 1,
        lastWatchedAt: 1
      }
    )
  }
}
