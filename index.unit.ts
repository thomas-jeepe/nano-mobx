import { Observable } from 'rxjs/Observable'
import 'rxjs/add/observable/of'
import { Subject } from 'rxjs/Subject'
import { ReplaySubject } from 'rxjs/ReplaySubject'
// the core
import {
  state,
  action,
  Atom,
  Reaction,
  computed,
  toState,
  stream,
  autorun
} from './'

describe('mobx', () => {
  it('should report a view to a reaction', () => {
    const a = new Atom()
    const r = new Reaction(() => null)
    r.track(() => a.view())
    expect(r.observing.size).toBe(1)
    expect(a.observers.size).toBe(1)
  })

  it('should call a reactions on a change', () => {
    const cb = jest.fn()
    const a = new Atom()
    const r = new Reaction(cb)
    r.track(() => a.view())
    action(() => a.change())()
    expect(cb.mock.calls.length).toBe(1)
  })

  it('should create a computed value that only recalculates observers are changed', () => {
    const a = new Atom(undefined)
    const cb = jest.fn(() => a.view())
    const c = computed(cb)
    c()
    c()
    expect(cb.mock.calls.length).toBe(1)
    action(() => a.change())()
    c()
    c()
    expect(cb.mock.calls.length).toBe(2)
  })

  it('should create a dynamic object with each property acting as an atom', () => {
    const s = toState({ hi: true, b: false })
    const r = new Reaction(() => null)
    r.track(() => {
      s.hi
      s.b
    })
    expect(s.hi).toBe(true)
    expect(s.b).toBe(false)
    expect(r.observing.size).toBe(2)
  })

  it('should be able to update the state using an action', () => {
    const cb = jest.fn()
    const s = toState({ hi: true, b: false })
    const r = new Reaction(cb)
    r.track(() => {
      s.hi
      s.b
    })
    action(() => (s.hi = false))()
    expect(s.hi).toBe(false)
    expect(cb.mock.calls.length).toBe(1)
    action(() => (s.b = true))()
    expect(s.b).toBe(true)
    expect(cb.mock.calls.length).toBe(2)
  })

  it('should throw when trying to update state outside of an action', () => {
    const s = toState({ hi: true, b: false })
    expect(() => (s.hi = false)).toThrow()
  })

  it('action should work as a decorator', () => {
    class Store {
      @state hi = 'true'
      @action
      blah() {
        this.hi = 'hi'
      }
    }
    const store = new Store()
    expect(store.hi).toBe('true')
    store.blah()
    expect(store.hi).toBe('hi')
  })

  it('autorun should run itself', () => {
    const state = toState({ hi: true })
    let called = 0
    autorun(() => {
      state.hi
      called++
    })
    expect(called).toBe(1)
    action(() => (state.hi = false))()
    expect(called).toBe(2)
  })

  it('computed should work as a function', () => {
    const state = toState({ hi: true })
    let called = 0
    const computer = computed(() => {
      called++
      return state.hi
    })
    expect(computer()).toBe(true)
    expect(called).toBe(1)
    expect(computer()).toBe(true)
    expect(called).toBe(1)
    action(() => (state.hi = false))()
    expect(computer()).toBe(false)
    expect(called).toBe(2)
    expect(computer()).toBe(false)
    expect(called).toBe(2)
  })

  it('computed should work as a decorator', () => {
    let called = 0
    class Store {
      @state hi = 'true'

      @computed
      get hii() {
        called++
        return this.hi + ' yoyo'
      }
    }
    const store = new Store()
    expect(store.hi).toBe('true')
    expect(called).toBe(0)
    expect(store.hii).toBe('true yoyo')
    expect(called).toBe(1)
    expect(store.hii).toBe('true yoyo')
    expect(called).toBe(1)
  })

  it('state should work as a decorator', () => {
    class Store {
      @state hi = 'true'

      @action
      blah() {
        this.hi = 'hi'
      }
    }
    const store = new Store()
    expect(store.hi).toBe('true')
    expect(() => (store.hi = 'kek')).toThrow()
    store.blah()
    expect(store.hi).toBe('hi')
    const store2 = new Store()
    expect(store2.hi).toBe('true')
    expect(() => (store2.hi = 'kek')).toThrow()
    store2.blah()
    expect(store2.hi).toBe('hi')
  })

  it('should create a state that works as an array', () => {
    class Store {
      @state arr: any[] = []

      @action
      push(v: any) {
        this.arr.push(v)
      }

      @action
      set(i: any, v: any) {
        this.arr[i] = v
      }
    }
    const store = new Store()
    const cb1 = jest.fn()
    const cb2 = jest.fn()
    const r1 = new Reaction(cb1)
    const r2 = new Reaction(cb2)
    r1.track(() => store.arr.length)
    r2.track(() => store.arr.map(_ => null))
    expect(store.arr.length).toBe(0)
    expect(cb1.mock.calls.length).toBe(0)
    expect(cb2.mock.calls.length).toBe(0)
    store.push(1)
    expect(cb1.mock.calls.length).toBe(1)
    expect(cb2.mock.calls.length).toBe(1)
    expect(store.arr).toEqual([1])
    r2.track(() => store.arr.map(_ => null))
    store.set(0, 2)
    expect(cb1.mock.calls.length).toBe(1)
    expect(cb2.mock.calls.length).toBe(2)
    expect(store.arr).toEqual([2])
  })

  it('should handle nested reactions', () => {
    const a1 = new Atom()
    const a2 = new Atom()
    const a3 = new Atom()
    const r1 = new Reaction(jest.fn())
    const r2 = new Reaction(jest.fn())
    const r3 = new Reaction(jest.fn())
    r1.track(() => {
      a1.view()
      r2.track(() => {
        a2.view()
        r3.track(() => {
          a3.view()
        })
      })
    })
    expect(r1.observing).toEqual(new Set([a1]))
    expect(r2.observing).toEqual(new Set([a2]))
    expect(r3.observing).toEqual(new Set([a3]))
  })

  it('should handle nested action', () => {
    class Store {
      @state x = 'false'

      @action
      cat() {
        this.x = 'cat'
      }

      @action
      dog() {
        this.x = 'dog'
        this.cat()
      }

      @action
      bird() {
        this.x = 'bird'
        this.dog()
      }
    }
    const store = new Store()
    store.bird()
    expect(store.x).toBe('cat')
  })

  it('should handle tracking and lessening of dependencies', () => {
    const a1 = new Atom()
    const a2 = new Atom()
    const r1 = new Reaction(jest.fn())
    r1.track(() => {
      a1.view()
      a2.view()
    })
    expect(a1.observers.size).toBe(1)
    expect(a2.observers.size).toBe(1)
    r1.track(() => a1.view())
    expect(a1.observers.size).toBe(1)
    expect(a2.observers.size).toBe(0)
  })

  it('should fully dispose of a reaction', () => {
    const a1 = new Atom()
    const a2 = new Atom()
    const r1 = new Reaction(jest.fn())
    r1.track(() => {
      a1.view()
      a2.view()
    })
    expect(a1.observers.size).toBe(1)
    expect(a2.observers.size).toBe(1)
    expect(r1.observing.size).toBe(2)
    r1.dispose()
    expect(a1.observers.size).toBe(0)
    expect(a2.observers.size).toBe(0)
    expect(r1.observing.size).toBe(0)
  })

  it('should create a stream value', () => {
    const count = new Subject()
    const str = stream(count)
    expect(str.current).toBe(undefined)
    count.next(true)
    expect(str.current).toBe(true)
    count.next(false)
    expect(str.current).toBe(false)
  })

  it('should react off a stream value', () => {
    const count = new Subject()
    const cb = jest.fn(() => str.current)
    const str = stream(count)
    autorun(cb)
    expect(cb.mock.calls.length).toBe(1)
    count.next(true)
    expect(cb.mock.calls.length).toBe(2)
    count.next(false)
  })

  it('should not react off the stream on initialization', () => {
    const count = new ReplaySubject()
    count.next(1)
    count.next(2)
    count.next(3)
    let str: any
    const cb = jest.fn(() => {
      if (!str) {
        str = stream(count)
      }
      str.current
    })
    autorun(cb)
    expect(cb.mock.calls.length).toBe(1)
    count.next(true)
    expect(cb.mock.calls.length).toBe(2)
    count.next(false)
  })

  it('should correctly handle nested state values', () => {
    class Blah {
      @state bleh: { arr: number[], prop: string, meh: { hey: boolean } } = {
        arr: [0],
        prop: 'hi',
        meh: { hey: true }
      }

      @action
      push() {
        this.bleh.arr.push(1)
      }

      @action
      meh() {
        this.bleh = { arr: [2], prop: 'hey', meh: { hey: true } }
      }
    }
    const blah = new Blah()
    expect(blah.bleh.prop).toBe('hi')
    expect(blah.bleh.meh).toEqual({ hey: true })
    expect(blah.bleh.arr).toEqual([0])
    blah.push()
    expect(blah.bleh.arr).toEqual([0, 1])
    blah.meh()
    expect(blah.bleh.prop).toBe('hey')
    expect(blah.bleh.arr).toEqual([2])
  })

  it('should correctly handle multiple instances of a class', () => {
    class X {
      @state hehe = 'hehe'
      @computed
      get hehe1() {
        return this.hehe + 'hehe'
      }
      @action
      setHehe(name: string) {
        this.hehe = name
      }
    }
    const x1 = new X()
    const x2 = new X()
    const x3 = new X()
    expect(x1.hehe).toBe('hehe')
    expect(x2.hehe).toBe('hehe')
    expect(x3.hehe).toBe('hehe')
    expect(x1.hehe1).toBe('hehehehe')
    expect(x2.hehe1).toBe('hehehehe')
    expect(x3.hehe1).toBe('hehehehe')
    x1.setHehe('1')
    x2.setHehe('2')
    x3.setHehe('3')
    expect(x1.hehe).toBe('1')
    expect(x2.hehe).toBe('2')
    expect(x3.hehe).toBe('3')
    expect(x1.hehe1).toBe('1hehe')
    expect(x2.hehe1).toBe('2hehe')
    expect(x3.hehe1).toBe('3hehe')
  })

  it('should correctly handle multiple actions', () => {
    class Y {
      @state hi = 'hi'

      @action
      hello() {
        this.hi = 'hello'
      }

      @action
      nice() {
        this.hello()
        this.hi = 'nice'
      }
    }
    const y = new Y()
    expect(y.hi).toBe('hi')
    y.nice()
    expect(y.hi).toBe('nice')
  })

  it('should correctly handle nested computed properties', () => {
    class Y {
      @state hi = 'cool'
      @computed
      get cooler() {
        return this.hi + 'er'
      }
      @computed
      get coolest() {
        return this.cooler + 'ist'
      }
      @action
      makeSuperCool() {
        this.hi = '😎🤑'
      }
    }
    const y = new Y()
    expect(y.cooler).toBe('cooler')
    expect(y.coolest).toBe('coolerist')
    y.makeSuperCool()
    expect(y.hi).toBe('😎🤑')
    expect(y.coolest).toBe('😎🤑erist')
    expect(y.cooler).toBe('😎🤑er')
  })

  it('should not create an infinite loop when using a stream and computed property', () => {
    class X {
      @state kek: string[] = []
      @computed
      get hi() {
        return this.kek.map(kek => stream(Observable.of(kek)))
      }
      @action
      push(kek: string) {
        this.kek.push(kek)
      }
    }
    const x = new X()
    x.hi
    x.push('kek')
  })

  it('should create a stream and correctly handle dependencies', () => {
    class Y {
      @state kek = 'kek'
      @computed
      get create() {
        stream(Observable.of('kek'))
        return this.kek
      }
      @action
      update() {
        this.kek = 'hehe'
      }
    }
    const y = new Y()
    expect(y.create).toBe('kek')
    y.update()
    expect(y.create).toBe('hehe')
  })
})
