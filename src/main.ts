import 'module-alias/register'
import dotenv from 'dotenv'
import DBServiceProvider from '@/providers/DBServiceProvider'
import RouteServiceProvider from '@/providers/RouteServiceProvider'
import EventServiceProvider from '@/providers/EventServiceProvider'
import ScheduleServiceProvider from '@/providers/ScheduleServiceProvider'

async function bootApp(): Promise<void> {
  await DBServiceProvider.boot()
  EventServiceProvider.boot()
  ScheduleServiceProvider.boot()
  const app = RouteServiceProvider.boot()
  app.listen(process.env.APP_PORT)
}

dotenv.config()
bootApp().then()
