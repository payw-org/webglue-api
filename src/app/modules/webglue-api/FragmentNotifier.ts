import BrowserHandler from '@/modules/BrowserHandler'

interface Selector {
  name: string
  offset: number
}

export default class FragmentNotifier {
  private static readonly VIEWPORT = { width: 1280, height: 800 }

  // public notify(): void {}

  public async capture(url: string, selector: Selector): Promise<string> {
    const page = await BrowserHandler.Instance.browser.newPage()
    await page.setViewport(FragmentNotifier.VIEWPORT)
    await page.goto(url, { waitUntil: 'networkidle2' })

    const element = (await page.$$(selector.name))[selector.offset]
    if (!element) {
      return null
    }

    const capture = await element.screenshot({
      encoding: 'base64'
    })

    await page.close()

    return capture
  }

  // public sendCaptureToUser(): void {}
}
