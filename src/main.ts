import 'module-alias/register'
import dotenv from 'dotenv'
import DBServiceProvider from '@/providers/DBServiceProvider'
import RouteServiceProvider from '@/providers/RouteServiceProvider'

async function bootApp(): Promise<void> {
  await DBServiceProvider.boot()
  const app = RouteServiceProvider.boot()
  app.listen(process.env.APP_PORT)
}

dotenv.config()
bootApp().then()
