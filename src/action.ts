import { globals } from './globals'

/**
 * The only way to edit state. Actions allow state to change and, when finished,
 * update all dependencies of the changed state.
 */
export function action(
  _: any,
  __: any,
  descriptor: PropertyDescriptor
): PropertyDescriptor
export function action<T extends Function>(fn: T, scope?: any): T
export function action<T extends Function>(
  target: T,
  scope?: any,
  desc?: PropertyDescriptor
): T | PropertyDescriptor {
  if (desc) {
    return {
      get() {
        return action(desc.value, this)
      }
    }
  }
  return ((...args: any[]) => {
    let lastinAction = globals.inAction
    globals.inAction = true
    let result = target.apply(scope, args)
    globals.inAction = lastinAction
    globals.pendingReactions.forEach(r => r.cb())
    globals.pendingReactions.clear()
    return result
  }) as any
}
