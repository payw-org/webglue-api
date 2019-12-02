import nodeMailer, { Transporter } from 'nodemailer'
import LogHelper from '@/modules/LogHelper'

export default class Mailer {
  private static _instance: Mailer

  /**
   * Mail transporter
   */
  private readonly transporter: Transporter

  /**
   * Get singleton instance
   *
   * @constructor
   */
  public static get Instance(): Mailer {
    if (this._instance === undefined) {
      this._instance = new this()
    }

    return this._instance
  }

  /**
   * Private constructor for singleton pattern
   */
  // eslint-disable-next-line no-useless-constructor
  private constructor() {
    this.transporter = nodeMailer.createTransport({
      service: process.env.MAIL_SERVICE,
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT),
      secure: true,
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD
      }
    })
  }

  public sendMail(mailOptions: object): void {
    this.transporter.sendMail(mailOptions, err => {
      if (err) {
        LogHelper.Instance.log('error', 'Mailer error: ' + err.stack)
      }
    })
  }
}
