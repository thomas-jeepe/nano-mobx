export interface IDependable {
  observers: Set<IDependent>
  [name: string]: any
}

export interface IDependent {
  observing: Set<IDependable>
  [name: string]: any
}

/**
 * Similar to mobx globals, simply shortened.
 *
 * Explained shortly:
 *
 * runningDependent:
 * Any reaction/computation that is being currently tracked. This is used
 * by Atoms in order to report that it has been observed.
 *
 * pendingReactions:
 * A set of reactions to be executed at the end of the action running.
 *
 * inAction:
 * Whether we are currently in an action
 */
export const globals: {
  runningDependent: IDependent | undefined
  pendingReactions: Set<IDependent>
  inAction: boolean
} = {
  runningDependent: undefined,
  pendingReactions: new Set(),
  inAction: false
}
