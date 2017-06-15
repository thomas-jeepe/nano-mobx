import { globals, IDependable } from './globals'

let reactionId = 0
let runId = 1

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
  newObserving: IDependable[] = []
  observing: IDependable[] = []
  name: string
  runId: number
  id = reactionId++
  constructor(public cb: () => void, name?: string) {
    this.name = name
      ? `Reaction@${name}@${reactionId}`
      : `Reaction@${reactionId}`
  }

  track(fn: () => void) {
    this.runId = runId++
    let lastReaction = globals.runningDependent
    globals.runningDependent = this
    fn()
    globals.runningDependent = lastReaction
    const oldDeps = this.observing
    const newDeps = (this.observing = this.newObserving)
    this.newObserving = []
    for (let i = 0; i < oldDeps.length; i++) {
      const dep = oldDeps[i]
      let found = false
      for (let j = 0; j < newDeps.length; j++) {
        if (dep === newDeps[j]) {
          found = true
          break
        }
      }
      if (!found) {
        dep.observers.delete(this)
      }
    }
    for (let i = 0; i < newDeps.length; i++) {
      newDeps[i].observers.add(this)
    }
  }

  dispose() {
    this.observing.forEach(a => a.observers.delete(this))
    this.observing = []
  }
}
