
var tape = require('tape')

var sl = require('../wasm')
var ll = require('../')
var d = require('../debug')
var deepEqual = require('deep-equal')
function flat (a) {
  return a < 0 ? -1 : a > 0 ? 1 : 0
}

console.log(sl)

tape('test compare', function (t) {

  sl.buffer.write('hello world', 20)
  sl.buffer.write('hello world2', 40)

  t.equal(flat(sl.compare(20, 11, 40, 12)), -1)
  t.equal(flat(sl.compare(40, 12, 20, 11)), 1)

  sl.buffer.write('abc', 60)
  sl.buffer.write('aBC', 80)
  t.equal(flat(sl.compare(60, 1, 80, 1)), 0)
  t.equal(flat(sl.compare(80, 1, 60, 1)), 0)

  t.equal(flat(sl.compare(60, 2, 80, 2)), 1)
  t.equal(flat(sl.compare(80, 2, 60, 2)), -1)

  t.equal(flat(sl.compare(60, 3, 80, 3)), 1)
  t.equal(flat(sl.compare(80, 3, 60, 3)), -1)

  t.equal(flat(sl.compare(80, 0, 60, 0)), 0)

  t.end()
})

tape('insert', function (t) {
//  var b = Buffer.alloc(10*1024)
  var b = sl.buffer
  var c = d.item(b, 0, [0, 0, 0, 0, 0, 0, 0])
  var a = [1,2,3,4,5]
  var _a = []
  a.forEach(function (v) {
    _a.push(v)
    ll.insert(b, c, v)
    try {
      deepEqual(d.all(b), _a.sort(function (a,b) { return a - b }))
    } catch (err) {
      console.log(d.dump(b))
      throw err
    }
  })
  a.forEach(function (v) {
    t.equal(b.readUInt32LE(ll.find(b, c, v)), v)
    t.equal(sl.find(c, v, 4), ll.find(b, c, v))
    t.equal(b.readUInt32LE(sl.find(c, v)), v)
  })
  t.deepEqual(d.all(b), a)

  t.end()

})

var crypto = require('crypto')

tape('compare strings', function (t) {
  var b = sl.buffer //Buffer.alloc(1024*10)
  var a = [], c = []
  for(var i = 0; i < 10; i++) {
    var free = b.readUInt32LE(0)
    var string = crypto.randomBytes(5 + ~~(Math.random()*10)).toString('hex')
    var length = Buffer.byteLength(string)
    a.push(string)
    c.push(free)
    b.write(string, free+4)
    b.writeUInt32LE(length, free)
    b.writeUInt32LE(free+length+4, 0) //update free pointer
    console.log('STRING', b.toString('utf8', free+4, free+4+b.readUInt32LE(free)))
  }
  for(var i = 0; i < a.length; i++) {
    for(var j = 0; j < a.length; j++) {
      t.equal(flat(sl.compareStrings(c[i], c[j])), a[i] < a[j] ? -1 : a[i] > a[j] ? 1 : 0)
    }
  }
  t.end()
})
return
tape('random strings', function (t) {
  var b = Buffer.alloc(100*1024)
  var c = d.item(b, 0, [0, 0, 0, 0, 0, 0])
  var map = {}
  for(var i = 0; i < 100; i++) {
    var str = crypto.randomBytes(5 + ~~(Math.random()*10)).toString('hex')
    var x = ll.insertString(b, c, str)
    map[str] = x
    console.log(x, ll.findString(b, c, str))
  }
  
  for(var k in map) {
    t.equal(ll.findString(b, c, k), map[k])
    t.equal(sl.findString(c, k, 5), map[k])
//    t.equal(ll.getString(b, ll.findString(b, c, k)), k)
  }
  t.end()

})











