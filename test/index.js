var deepEqual = require('assert').deepEqual
var ll = require('../')
var d = require('../debug')
var crypto = require('crypto')
var tape = require('tape')

tape('simple', function (t) {
  var b = Buffer.alloc(1000)
  var c = d.item(b, 10, [0])
  t.deepEqual(d.all(b), [])
  t.end()
})

tape('increasing items', function (t) {
  var b = Buffer.alloc(10*1024)
  var c = d.item(b, 0, [0, 0, 0, 0, 0, 0, 0])
  var a = [1,2,3,4,5]
  var _a = []
  a.forEach(function (v) {
    _a.push(v)
    ll.insert(b, c, v)
    try {
      deepEqual(d.all(b), _a.sort(function (a,b) { return a - b }))
    } catch (err) {
      throw err
    }
  })
  t.deepEqual(d.all(b), a)
  t.end()
})

tape('decreasing items', function (t) {
  var b = Buffer.alloc(10*1024)
  var c = d.item(b, 0, [0, 0, 0, 0, 0, 0, 0])
  var a = [1,2,3,4,5]
  var _a = []
  a.slice().reverse().forEach(function (v) {
    _a.push(v)
    ll.insert(b, c, v)
    deepEqual(d.all(b), _a.sort(function (a,b) { return a - b }))
  })
  t.deepEqual(d.all(b), a)
  t.end()
})

tape('random items', function (t) {

  for(var j = 0; j < 10; j++) {
    var b = Buffer.alloc(100*1024)
    var c = d.item(b, 0, [0, 0, 0, 0, 0, 0])
    var a = []
    for(var i = 0; i < 50; i++) {
      var s = b.toString('hex', 0, b.readUInt32LE(0))
      var v = ~~(1000*Math.random())
      a.push(v)
      ll.insert(b, c, v)
      deepEqual(d.all(b), a.slice().sort(function (a, b) { return a - b }))
      t.deepEqual(d.all(b), a.slice().sort(function (a, b) { return a - b }))
      a.forEach(function (v) {
        //searching for an exact value always returns the pointer to that value.
        var p = ll.find(b, c, v)
        t.equal(b.readUInt32LE(p), v)
      })
    }
  }

  t.end()
})

tape('random strings', function (t) {
  var b = Buffer.alloc(100*1024)
  var c = d.item(b, 0, [0, 0, 0, 0, 0, 0])
  var map = {}
  for(var i = 0; i < 100; i++) {
    var str = crypto.randomBytes(5 + ~~(Math.random()*10)).toString('hex')
    console.log("INSERT", str)
    var x = ll.insertString(b, c, str)
    map[str] = x
    console.log(x, ll.findString(b, c, str))
  }
  for(var k in map) {
    t.equal(ll.findString(b, c, k), map[k])
    t.equal(ll.getString(b, ll.findString(b, c, k)), k)
  }
  t.end()
})

return
tape('same string twice, inbetween string', function (t) {
  var b = Buffer.alloc(100*1024)
  var c = d.item(b, 0, [0, 0, 0, 0, 0, 0])
  console.log("C", c)
  var x = ll.insertString(b, c, 'abc')
  console.log("X", x)
  t.equal(ll.findString(b, c, 'abc'), x)
  //current behaviour: finds the last equal string.
  var x2 = ll.insertString(b, c, 'abc2')
  console.log("X2", x2)
  t.equal(ll.findString(b, c, 'abc2'), x2)

  //find a string inbetween last item and end
  var x3 = ll.findString(b, c, 'abz')

  console.log("X3", x3)
  t.equal(x3, x2, 'after last item')

  var x4 = ll.findString(b, c, '!a')
  //console.log(ll.getString(x4))
  t.equal(x4, x, 'before first item')
  console.log("X4", x4)

  var x5 = ll.findString(b, c, 'abc1')
  t.equal(x4, x2, 'after first item')


  t.end()

})





















