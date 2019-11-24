import request from 'request-promise-native'

export default class UniformURL {
  /**
   * Uniform url by request to the target as head method.
   *
   * @param url
   * @throws If request is malformed
   */
  public static async uniform(url: string): Promise<string> {
    let uniformURL

    await request(
      {
        url: url,
        method: 'head'
      },
      (error, response) => {
        if (!error) {
          uniformURL = response.request.uri.href // update to actual url
        } else {
          throw error
        }
      }
    )

    return uniformURL
  }
}
