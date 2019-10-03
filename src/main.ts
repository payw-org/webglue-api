import dotenv from 'dotenv'
import DBServiceProvider from 'Providers/DBServiceProvider'

async function bootApp(): Promise<void> {
  await DBServiceProvider.boot()
}

dotenv.config()
bootApp().then()
