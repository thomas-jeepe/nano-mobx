import { Computation } from './Computation'

export function computed<T>(fn: () => T, name?: string): () => T
export function computed(
  _: any,
  __: any,
  desc: PropertyDescriptor
): PropertyDescriptor
export function computed<T>(fn: () => T, name?: string, desc?: any): any {
  if (desc) {
    const data = Symbol('computedfn@' + name)
    let fn = desc.get
    return {
      get() {
        if (!this[data]) {
          this[data] = computed(
            fn.bind(this),
            this.constructor.name + '@' + name
          )
        }
        return this[data]()
      }
    }
  }
  let comp = new Computation(fn, name)
  return comp.get
}
