import DBConnector from '@/database/DBConnector'

export default class DBServiceProvider {
  public static async boot(): Promise<void> {
    await DBConnector.connect()
  }
}
