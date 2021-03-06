import { globals, IDependent } from './globals'

let atomId = 0
/**
 * The basic observable, anything depends on atoms. An atom is simply
 * a thing you can look at change. The atom doesn't store values. It
 * simply reports that it has been changed or viewed. This is what reactions
 * and computations depend upon
 *
 * @export
 * @class Atom
 */
export class Atom {
  observers: Set<IDependent> = new Set()
  lastAccessedBy = 0
  id = atomId++
  name: string
  constructor(name?: string) {
    this.name = name ? `Atom@${name}@${this.id}` : `Atom@${this.id}`
  }

  change() {
    if (!globals.inAction) {
      throw new Error('Tried to set outside of an action')
    }
    this.observers.forEach(r => globals.pendingReactions.add(r))
  }

  view() {
    const dep = globals.runningDependent
    if (dep) {
      if (dep.runId !== this.lastAccessedBy) {
        this.lastAccessedBy = dep.runId
        dep.newObserving.push(this)
      }
    }
  }
}
