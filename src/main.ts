import dotenv from 'dotenv'
import DBServiceProvider from 'Providers/DBServiceProvider'
import RouteServiceProvider from 'Providers/RouteServiceProvider'

async function bootApp(): Promise<void> {
  await DBServiceProvider.boot()
  const app = RouteServiceProvider.boot()
  app.listen(process.env.APP_PORT)
}

dotenv.config()
bootApp().then()
