import { Reaction } from './Reaction'

export function autorun(fn: () => void, name?: string): Reaction {
  const r: Reaction = new Reaction(() => r.track(fn), name)
  r.cb()
  return r
}
