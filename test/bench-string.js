var ll = require('../')
var d = require('../debug')
var w = require('../wasm')
var crypto = require('crypto')
w.grow(10000)

var b = w.buffer //Buffer.alloc(4*1024*1024)
var L = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
var c = d.item(b, 0, L)

var start = Date.now()
var N = 200000
var a = []
for(var i = 0; i < N; i++)
  a.push(crypto.randomBytes(5+~~(10*Math.random())).toString('base64'))

for(var i = 0; i < N; i++) {
  ll.insertString(b, c, a[i])
}
console.log('insert', Date.now() - start)

var start = Date.now()
for(var i = 0; i < N; i++) {
  var v = a[~~(a.length*Math.random())]
  ll.findString(b, c, v)
}
console.log('findString', Date.now() - start)


var start = Date.now()
for(var i = 0; i < N; i++) {
  var v = a[~~(a.length*Math.random())]
  w.findString(c, v, L.length-1)
}
console.log('findString.wasm', Date.now() - start)








