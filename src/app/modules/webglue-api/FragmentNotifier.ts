import BrowserHandler from '@/modules/BrowserHandler'
import { UserDoc } from '@@/migrate/schemas/user'
import Mailer from '@/modules/Mailer'

interface Selector {
  name: string
  offset: number
}

export default class FragmentNotifier {
  private static readonly VIEWPORT = { width: 1280, height: 800 }

  public async notify(
    user: UserDoc,
    url: string,
    selector: Selector
  ): Promise<void> {
    const captureImg = await this.capture(url, selector)
    this.sendCaptureToUser(user, url, captureImg)
  }

  private async capture(url: string, selector: Selector): Promise<string> {
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

  private sendCaptureToUser(user: UserDoc, url: string, capture: string): void {
    Mailer.Instance.sendMail({
      from: '"webglue notifier" <contact@payw.org>',
      to: user.email,
      subject: 'webglue fragment 변화 알림',
      html: `<a href="${url}"><img src="cid:changed@fragment.ee" /></a>`,
      attachments: [
        {
          filename: 'fragment.png',
          content: capture,
          encoding: 'base64',
          cid: 'changed@fragment.ee' // same cid value as in the html img src
        }
      ]
    })
  }
}
