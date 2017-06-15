import { globals, IDependable } from './globals'

let reactionId = 0

/**
 * A dependency upon computations or atoms. In a basic sense, a reaction is
 * basically a callback that is called whenever something it depends upon is
 * changed. The track function is used to decide the dependencies, by running
 * the passed function and seeing what has been viewed.
 *
 * @export
 * @class Reaction
 */
export class Reaction {
  observing: Set<IDependable> = new Set()
  name: string
  id = reactionId++
  constructor(public cb: () => void, name?: string) {
    this.name = name
      ? `Reaction@${name}@${reactionId}`
      : `Reaction@${reactionId}`
  }

  track(fn: () => void) {
    const newDeps = new Set()
    const oldDeps = this.observing
    this.observing = newDeps
    let lastReaction = globals.runningDependent
    globals.runningDependent = this
    fn()
    globals.runningDependent = lastReaction
    oldDeps.forEach(a => {
      if (newDeps.has(a)) {
        return
      }
      a.observers.delete(this)
    })
  }

  dispose() {
    this.observing.forEach(a => a.observers.delete(this))
    this.observing.clear()
  }
}
