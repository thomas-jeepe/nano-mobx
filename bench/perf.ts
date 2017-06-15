import { toState, computed, Reaction, state, Atom, action } from '../src'
import {
  observable,
  computed as mobxComputed,
  Reaction as MobxReaction,
  Atom as MobxAtom,
  action as mobxAction
} from 'mobx'
import { Suite } from 'benchmark'

function runSuite(name: string, suite: Suite) {
  suite
    .on('start', () => {
      console.log('Starting: ' + name)
    })
    .on('cycle', (ev: any) => {
      console.log(String(ev.target))
    })
    .on('complete', function(this: Suite) {
      console.log('Fastest is ' + this.filter('fastest').map('name' as any))
    })
    .run({ async: false })
}

runSuite(
  'Array Creation',
  new Suite()
    .add('nano#toState', () => {
      toState([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    })
    .add('mobx#observable', () => {
      observable([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    })
)

runSuite(
  'Object Creation',
  new Suite()
    .add('nano#toState', () => {
      toState({ a: 1, b: 2, c: 3, d: 4, e: 4 })
    })
    .add('mobx#observable', () => {
      observable({ a: 1, b: 2, c: 3, d: 4, e: 4 })
    })
)

const baseArr = new Array(100)

for (let i = 0; i < baseArr.length; i++) {
  baseArr[i] = i
}

const narr = toState(baseArr.slice())
const marr = observable(baseArr.slice())
let preventNoop = 0
runSuite(
  'Array iteration length = 100',
  new Suite()
    .add('nano#forEach', () => {
      narr.forEach(n => n + 1)
    })
    .add('mobx#forEach', () => {
      marr.forEach(n => n + 1)
    })
    .add('nano#map', () => {
      narr.map(n => n + 1)
    })
    .add('mobx#map', () => {
      marr.map(n => n + 1)
    })
    .add('nano#reduce', () => {
      narr.reduce((acc, v) => acc + v)
    })
    .add('mobx#reduce', () => {
      marr.reduce((acc, v) => acc + v)
    })
    .add('nano# for loop', () => {
      for (let i = 0; i < narr.length; i++) {
        preventNoop += narr[i]
      }
    })
    .add('mobx# for loop', () => {
      for (let i = 0; i < narr.length; i++) {
        preventNoop += marr[i]
      }
    })
)

class N {
  @state bool = true

  @action
  toggle() {
    this.bool = !this.bool
  }
}
const ns = new N()
class M {
  @observable bool = true
  @mobxAction
  toggle() {
    this.bool = !this.bool
  }
}
const ms = new M()
runSuite(
  'setting a store property with an action',
  new Suite()
    .add('nano', () => {
      ns.toggle()
    })
    .add('mobx', () => {
      ms.toggle()
    })
)
const na = new Atom()
const ma = new MobxAtom()
const nr = new Reaction(() => undefined)
const mr = new MobxReaction('', () => undefined)

runSuite(
  'Tracking of observables/state',
  new Suite()
    .add('nano', () => {
      nr.track(() => na.view())
    })
    .add('mobx', () => {
      mr.track(() => ma.reportObserved())
    })
)

const nanoData = toState({ a: 'hi' })
const mobxData = observable({ a: 'hi' })

const nanoComputation = computed(() => nanoData.a + 'hi')
const mobxComputation = mobxComputed(() => mobxData.a + 'hi')

const nanoReaction = new Reaction(() => undefined)
const mobxReaction = new MobxReaction('', () => undefined)

runSuite(
  'Getting of computations',
  new Suite()
    .add('nano#computed', () => {
      nanoComputation()
    })
    .add('mobx#computed', () => {
      mobxComputation.get()
    })
)

runSuite(
  'Getting of computations with tracking',
  new Suite()
    .add('nano#computed', () => {
      nanoReaction.track(() => nanoComputation())
    })
    .add('mobx#computed', () => {
      mobxReaction.track(() => mobxComputation.get())
    })
)

class Nano {
  @state cool = true
}
const n = new Nano()
class Mobx {
  @observable cool = true
}
const m = new Mobx()

runSuite(
  'Getting of state property',
  new Suite()
    .add('nano#@state', () => {
      n.cool
    })
    .add('mobx#@observable', () => {
      m.cool
    })
)
