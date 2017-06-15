import { Observable } from 'rxjs/Observable'
import { Atom } from './Atom'
import { action } from './action'
import { isState } from './state'

/**
 * Utility to convert a rxjs stream into an observable. Not part of the mobx core
 *
 * @export
 * @template T
 * @param {Observable<T>} observable
 * @param {string} [name]
 * @returns {{ current: T }}
 */
export function stream<T>(
  observable: Observable<T>,
  name?: string
): { current: T } {
  let a = new Atom('Stream ' + name)
  let current: T
  const val = {
    get current() {
      a.view()
      return current
    },
    [isState]: true
  }
  // in order to prevent start up circular loops
  let initializing = true
  observable.subscribe((next: any) => {
    current = next
    if (!initializing) {
      action(() => a.change())()
    }
  })
  initializing = false
  return val
}
