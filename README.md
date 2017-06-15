# nano-mobx
A ~300 LOC mobx implementation leveraging es6 features

# Why?

Mobx is super cool, but it is pretty big as it has to deal with certain problems which are handled in es6. `Proxy`, introduced in es6, is in all major browsers today and handles many of the problems which mobx has to have extra code in order to solve.

Mobx also has to deal with decorators, which having differences in Babel and Typescript cause a lot of pain.

By removing these factors and simply coding with Typescript -> es6 in mind, I was able to cut down a lot of uneccesary code and make a viable ~300 LOC implementation of the core functionality.

`useStrict` is enabled by default, meaning state changes can only occur in an action.

# Functionality

Note: `observable` has been renamed to `state`, because it should've been named that way to begin with.

## State

This module supports state decorators `@state checked = false` for classes and `toState` to convert objects or arrays to a mobx representation (using `Proxy`). The array and object representations are actual arrays an objects. In fact, the stateful array is an array per `Array.isArray`. All methods that work on objects and arrays work on the stateful representation.

Example:


```js
class X {
  @state checked = false
}

const x = new X()
const arr = toState([1,2,3])

Array.isArray(arr) // true
arr.map // exists as with all other methods

// both throw because they are changes that are not in an action
x.checked = true
arr[0] = 1
```

Boxed values and shallow state are not implemented.

No state is shallow, any time something is passed to `@state` or `toState`, it is made recursively into stateful objects and arrays. This includes any property set that is stateful (on a class, object or array). They are all set to stateful objects and arrays.

## Computed values

This module also supports computed values; however, they are implemented differently. They *are not* lazy. They are always kept up to date.

An example:

```js
class X {
  @state isCool = false

  @computed get asString() {
    return this.isCool.toString()
  }

  @action turnIntoKenWheeler {
    this.isCool = true
  }
}

const x = new X()

x.asString // evaluated once here
x.asString // cached
x.turnIntoKenWheeler() // x.asString is reevaluated here and the value is set to 'true'
x.asString // cached
```

## Actions

Actions work the same as they do in mobx, except there is no opt out. They have to be used for *any* state change.

## Reactions

Work similar to mobx, create a reaction via `new Reaction(callback)` and track a function with the reaction method `track`. Reactions work the same in mobx in that if any dependency changes, the callback is called.

## Conclusion

I got an Inferno app working with this module, and the test suit covers many different scenarios, so this module is in a pretty good shape. I don't neccesarily plan on releasing this module as an npm module, but if you have any suggestions or comments just tweet me [@Penguinnsoccer](https://twitter.com/Penguinnsoccer).

I haven't done any performance tests, so I have no idea if the runtime is faster.

If you would like to mess around with the module:

```bash
git clone https://github.com/thomas-jeepe/nano-mobx.git
cd nano-mobx
yarn
yarn test # for running all tests
yarn format # for formatting the code
```

I also use wallaby; so for anyone who wants to use wallaby, you can simply `yarn` for the dependencies and use the wallaby.js config file

Quick note: Rxjs is used in my project, so I just decided to keep it in the module for now. It is not neccessary to the core functionality