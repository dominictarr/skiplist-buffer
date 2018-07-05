var ll = require('../')
var d = require('../debug')
var w = require('../wasm')
w.grow(1000)
var b = w.buffer //Buffer.alloc(4*1024*1024)
var L = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
var c = d.item(b, 0, L)

var start = Date.now()
var N = 2000000
for(var i = 0; i < N; i++) {
  var v = ~~(100000*Math.random())
  ll.insert(b, c, v)
}
console.log('insert', Date.now() - start)

var start = Date.now()
for(var i = 0; i < N; i++) {
  ll.levels(b, c)
}
console.log('levels', Date.now() - start)

var start = Date.now()
for(var i = 0; i < N; i++) {
  var v = ~~(100000*Math.random())
  ll.find(b, c, v)
}
console.log('find', Date.now() - start)


var start = Date.now()
for(var i = 0; i < N; i++) {
  var v = ~~(100000*Math.random())
  w.find(c, v, L.length)
}
console.log('find.wasm', Date.now() - start)

