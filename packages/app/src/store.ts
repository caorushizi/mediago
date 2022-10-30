const Store = require('electron-store')

const schema = {
  foo: {
    type: 'number',
    maximum: 100,
    minimum: 1,
    default: 50
  },
  bar: {
    type: 'string',
    format: 'url'
  }
}

const store = new Store({ schema })

console.log(store.get('foo'))
//= > 50

store.set('foo', '1')
// [Error: Config schema violation: `foo` should be number]
