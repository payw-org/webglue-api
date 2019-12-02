import schedule from 'node-schedule'
import FragmentWatcher from '@/modules/webglue-api/FragmentWatcher'

export default class ScheduleServiceProvider {
  public static boot(): void {
    this.scheduleWatcher()
  }

  private static scheduleWatcher(): void {
    // watch fragment every 5 minutes
    schedule.scheduleJob('*/5 * * * *', () => {
      FragmentWatcher.Instance.watch().then()
    })
  }
}
