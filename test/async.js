var deepEqual = require('assert').deepEqual


var ll = require('../')
var d = require('../debug')
ll.dump = d.dump
ll.all = d.all
ll.item = d.item

var tape = require('tape')

tape('decreasing items', function (t) {
  var b = Buffer.alloc(10*1024)
  var c = ll.item(b, 0, [0, 0, 0, 0, 0, 0, 0])
  var a = [1,2,3,4,5]
  var _a = []
  a.slice().reverse().forEach(function (v) {
    _a.push(v)
    ll.insert(b, c, v)
    try {
      deepEqual(ll.all(b), _a.sort(function (a,b) { return a - b }))
    } catch (err) {
      console.log(ll.dump(b))
      throw err
    }
  })
  t.deepEqual(ll.all(b), a)
  a.forEach(function (target) {
    console.log('find')
    var called = false
    ll.findAsync(b, function get(value, cb) {
      console.log('GET', value)
      cb(null, value)
    }, c, target, null, function (err, value, ptr) {
      called = true
      console.log("EQUAL", value, target)
      t.equal(value, target)
    })
    if(!called) throw new Error('did not call cb')
  })
  t.end()
})

tape('decreasing items, async insert', function (t) {
  var b = Buffer.alloc(10*1024)
  var c = ll.item(b, 0, [0, 0, 0, 0, 0, 0, 0])
  var a = [1,2,3,4,5]
  var _a = []

  function get(value, cb) {
    cb(null, value*1)
  }

  a.slice().reverse().forEach(function (v) {
    _a.push(v)
    ll.insertAsync(b, get, c, v*1, v*1, null, function (err, ptr) {
      console.log('wrote', ptr)
    })
  })
  console.log(ll.dump(b))
  return t.end()
  _a.forEach(function (target) {
    console.log('find')
    var called = false
    ll.findAsync(b, get, c, target, null, function (err, value, ptr) {
      called = true
      console.log("EQUAL", value, target)
      t.equal(value, target)
    })
    if(!called) throw new Error('did not call cb')
  })
  t.end()
})





