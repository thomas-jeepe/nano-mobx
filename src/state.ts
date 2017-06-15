import { Atom } from './Atom'
import { globals } from './globals'

export function toState<T>(v: T): T {
  if (v && typeof v === 'object' && !(v as any)[isState]) {
    return objState(v)
  } else {
    return v
  }
}

export const isState = Symbol('isState')

export function objState<T>(obj: T) {
  const atoms = new Map<any, Atom>()
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => {
      obj[i] = toState(v)
      atoms.set(i, new Atom(`Array[${i}]`))
    })
    atoms.set('length', new Atom('Array.length'))
  } else {
    Object.keys(obj).forEach(key => {
      ;(obj as any)[key] = toState((obj as any)[key])
      atoms.set(key, new Atom(`Object.${key}`))
    })
  }
  function get(obj: any, name: any) {
    if (name === isState) {
      return true
    }
    if (atoms.has(name)) {
      ;(atoms.get(name) as Atom).view()
    }
    return obj[name]
  }
  function set(_: any, name: any, val: any) {
    if (!globals.inAction) {
      throw new Error('Tried to set outside of an action')
    }
    val = toState(val)
    ;(obj as any)[name] = val
    if (atoms.has(name)) {
      ;(atoms.get(name) as Atom).change()
    } else {
      atoms.set(
        name,
        new Atom(Array.isArray(obj) ? `Array[${name}]` : `Object.${name}`)
      )
    }
    return true
  }
  return new Proxy(obj, { get, set }) as { [K in keyof T]: T[K] }
}

export function state(_: any, name: any): any {
  const atom = Symbol(name)
  const value = Symbol(name + 'value')
  return {
    get() {
      if (!this[atom]) {
        this[isState] = true
        this[atom] = new Atom(_.constructor.name + '.' + name)
        this[value] = undefined
      }
      this[atom].view()
      return this[value]
    },
    set(val: any) {
      if (!this[atom]) {
        this[isState] = true
        this[atom] = new Atom(_.constructor.name + '.' + name)
        this[value] = toState(val)
      } else {
        this[value] = toState(val)
        this[atom].change()
      }
      return true
    }
  }
}
