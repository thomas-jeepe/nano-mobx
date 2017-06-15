import { Reaction } from './Reaction'
import { globals, IDependent } from './globals'

/**
 * A mix between Atom and Reaction. It is dependent and dependable, i.e.
 * It depends on Atoms or Computations and Reactions or Computations can
 * depend upon it.
 *
 * It is different than mobx computations in that it is not lazily evaluated.
 * The computation is always kept up to date.
 *
 * @export
 * @class Computation
 * @extends {Reaction}
 * @template T 
 */
export class Computation<T> extends Reaction {
  val: T
  observers: Set<IDependent> = new Set()
  name: string

  constructor(public fn: () => T, name?: string) {
    super(() => {
      this.track(() => {
        try {
          this.val = fn()
        } catch (e) {
          console.warn('Error in computed value' + name)
          console.error(e)
        }
      })
      this.observers.forEach(dep => {
        dep.cb && dep.cb()
      })
    }, name ? `Computed@${name}` : `Computed`)
    this.track(this.cb)
  }

  get = () => {
    if (globals.runningDependent) {
      this.observers.add(globals.runningDependent)
      globals.runningDependent.observing.add(this)
    }
    return this.val
  };
}
