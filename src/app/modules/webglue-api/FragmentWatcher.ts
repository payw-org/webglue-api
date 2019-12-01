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
}
