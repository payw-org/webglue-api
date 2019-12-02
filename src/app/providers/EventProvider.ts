import FragmentWatcher from '@/modules/webglue-api/FragmentWatcher'
import FragmentNotifier from '@/modules/webglue-api/FragmentNotifier'
import { UserDoc } from '@@/migrate/schemas/user'

export default class EventProvider {
  public static boot(): void {
    this.registerFragmentEvent()
  }

  private static registerFragmentEvent(): void {
    FragmentWatcher.Instance.on(
      FragmentWatcher.CHANGE_EVENT,
      (
        user: UserDoc,
        url: string,
        selector: { name: string; offset: number }
      ) => {
        const notifier = new FragmentNotifier()
        notifier.notify(user, url, selector)
      }
    )
  }
}
