import test from 'tape'
import ThunderJS from '../src/thunderJS'
import sinon from 'sinon'

const options = { host: 'localhost' }

test('ThunderJS lib - Type', assert => {
  let expected = 'function'
  let actual = typeof ThunderJS

  assert.equal(actual, expected, 'ThunderJS (library) should return a (factory) function')
  assert.end()
})

test('thunderJS instance - Type', assert => {
  // initialize the lib
  let thunderJS = ThunderJS(options)

  let expected = 'object'
  let actual = typeof thunderJS

  assert.equal(actual, expected, 'thunderJS (instance) should return an object')
  assert.end()
})

test('thunderJS instance - Methods', assert => {
  let thunderJS = ThunderJS(options)

  let expected = ['call', 'subscribe', 'unsubscribe', 'registerPlugin']
  let actual = Object.keys(thunderJS).filter(key => {
    // get the object keys that are a function
    return typeof thunderJS[key] === 'function'
  })

  assert.deepEqual(actual, expected, 'thunderJS (instance) should have all expected methods')
  assert.end()
})

test('thunderJS - device plugin', assert => {
  let thunderJS = ThunderJS(options)

  let expected = 'object'
  let actual = typeof thunderJS.device

  assert.equal(actual, expected, 'thunderJS should have a `device` key that returns an `object`')

  expected = ['freeRam', 'version']
  actual = Object.keys(thunderJS.device).filter(key => {
    // get the object keys that are a function
    return typeof thunderJS[key] === 'function'
  })

  assert.deepEqual(actual, expected, 'device plugin should have all the methods')
  assert.end()
})

// argument based call
test('thunderJS - register custom plugin', assert => {
  let thunderJS = ThunderJS(options)

  thunderJS.registerPlugin('custom', {
    foo() {},
  })

  let expected = 'object'
  let actual = typeof thunderJS.custom

  assert.equal(actual, expected, 'custom plugin should be available as a key on thunderJS')

  expected = 'function'
  actual = typeof thunderJS.custom.foo

  assert.equal(
    actual,
    expected,
    'custom plugin method should be available on thunderJS under the plugin "namespace"'
  )

  assert.end()
})

const plugin = {
  foo() {},
  bar() {},
}
const fooSpy = sinon.spy(plugin, 'foo')
const barSpy = sinon.spy(plugin, 'bar')

test('thunderJS - call - argument based', assert => {
  let thunderJS = ThunderJS(options)

  fooSpy.resetHistory()
  barSpy.resetHistory()

  thunderJS.registerPlugin('custom', plugin)

  // make calls using argument style
  thunderJS.call('custom', 'foo')
  thunderJS.call('custom', 'bar')

  assert.ok(fooSpy.calledOnce, 'Should call the foo method on the custom plugin')
  assert.ok(barSpy.calledOnce, 'Should call the bar method on the custom plugin')

  assert.end()
})

test('thunderJS - call - object based', assert => {
  let thunderJS = ThunderJS(options)

  fooSpy.resetHistory()
  barSpy.resetHistory()

  thunderJS.registerPlugin('custom', plugin)

  // make calls using object style
  thunderJS.custom.foo()
  thunderJS.custom.bar()

  assert.ok(fooSpy.calledOnce, 'Should call the foo method on the custom plugin')
  assert.ok(barSpy.calledOnce, 'Should call the bar method on the custom plugin')

  assert.end()
})

test('thunderJS - response - promise', assert => {
  let thunderJS = ThunderJS(options)

  thunderJS.registerPlugin('custom', {
    promise() {
      return new Promise((resolve, reject) => {})
    },
    value() {
      return 'hello!'
    },
  })

  // call promise method and see if it has a then function (as promises do)
  let actual = thunderJS.custom.promise().then
  assert.ok(actual, 'Calls on thunderJS should return a promise')

  // Todo:

  // call value method and see if it has a then function (as promises do)
  // actual = thunderJS.custom.value().then
  // assert.ok(
  //   actual,
  //   'Calls on thunderJS should return a promise (even if the method only returns a value)'
  // )

  assert.end()
})

const plugin2 = {
  success() {
    return new Promise((resolve, reject) => {
      resolve('😎')
    })
  },
  failure() {
    return new Promise((resolve, reject) => {
      reject('😭')
    })
  },
}

test('thunderJS - response - then / catch', assert => {
  let thunderJS = ThunderJS(options)

  const successSpy = sinon.spy()
  const failureSpy = sinon.spy()

  thunderJS.registerPlugin('custom', plugin2)

  assert.plan(2)

  thunderJS
    .call('custom', 'success')
    .then(successSpy)
    .catch(failureSpy)
    .finally(() => {
      assert.ok(successSpy.calledOnceWith('😎'), 'Success method should be called once')
    })

  thunderJS
    .call('custom', 'failure')
    .then(successSpy)
    .catch(failureSpy)
    .finally(() => {
      assert.ok(failureSpy.calledOnceWith('😭'), 'Failure method should be called once')
    })
})

test('thunderJS - response - passing callback', assert => {
  let thunderJS = ThunderJS(options)

  const callback = () => {}

  const callbackSpy = sinon.spy(callback)

  thunderJS.registerPlugin('custom', plugin2)

  thunderJS.call('custom', 'success', callbackSpy)
  thunderJS.call('custom', 'failure', callbackSpy)

  // next tick
  setTimeout(() => {
    assert.ok(
      callbackSpy.calledWith(null, '😎'),
      'Callback should be called once with null as first param and success as second'
    )
    assert.ok(
      callbackSpy.calledWith('😭'),
      'Callback should be called once with only the error as first param'
    )
    assert.end()
  }, 0)
})