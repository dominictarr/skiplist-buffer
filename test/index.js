var deepEqual = require('assert').deepEqual
var ll = require('../')

var tape = require('tape')

tape('simple', function (t) {
  var b = Buffer.alloc(100)
  var c = ll.item(b, 10, [0])
  t.equal(c, 8)
  t.equal(b.readUInt32LE(0), 16)
  console.log(b)
  t.deepEqual(ll.dump(b), {
    0: {value: 16, levels: [8]},
    8: {value: 10, levels: [0]},
  })
  t.end()
})

tape('simple 2 items', function (t) {
  var b = Buffer.alloc(100)
  var c = ll.item(b, 10, [16])
  t.equal(b.readUInt32LE(0), 16)
  t.equal(c, 8)
  var c = ll.item(b, 20, [0])
  t.equal(b.readUInt32LE(0), 24)
  t.equal(c, 16)
  console.log(b)
  t.deepEqual(ll.dump(b), {
    0: {value: 24, levels: [8]},
    8: {value: 10, levels: [16]},
    16: {value: 20, levels: [0]},
  })
  t.end()
})

tape('simple 4 items', function (t) {
  var b = Buffer.alloc(100)
  var c = ll.item(b, 0, [24, 32, 0])
  var f = c
  t.equal(b.readUInt32LE(0), 8+4+4*3)
  t.equal(c, 8)
  var c = ll.item(b, 15, [32])
  t.equal(c, 24)
  var c = ll.item(b, 20, [44, 60])
  var c = ll.item(b, 25, [52])
  var c = ll.item(b, 27, [60])
//  t.equal(c, 24)
  var c = ll.item(b, 30, [0, 0])
  //t.equal(c, 36)
  console.log(ll.dump(b))
  ;[21, 1, 17, 29].forEach(function (target) {
    var a = ll.find(b, f, target)
    console.log('find:', target, a)
    var ptr = a.pop()
    t.ok(ll.get(b, ptr) <= target, 'found smaller or equal to target')
    t.ok(ll.get(b, ll.next(b, ptr, 0)) > target, 'next is greater than target')
  })

  
  ll.insert(b, f, 29)

  console.log(ll.dump(b))
//  console.log(ll.all(b))
//  ll.insert(b, f, 31)
//  console.log(ll.dump(b))
//  console.log(ll.all(b))
//

  t.end()
})


tape('insert first item', function (t) {
  var b = Buffer.alloc(10*1024)
  var c = ll.item(b, 0, [0, 0, 0, 0, 0, 0, 0])
  console.log(ll.dump(b))

  ll.insert(b, c, 1000)
  console.log(ll.dump(b))
  
  t.end()
})

tape('increasing items', function (t) {
  var b = Buffer.alloc(10*1024)
  var c = ll.item(b, 0, [0, 0, 0, 0, 0, 0, 0])
  var a = [1,2,3,4,5]
  var _a = []
  a.forEach(function (v) {
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
  t.end()
})

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
  t.end()
})

tape('problems', function (t) {
  b = Buffer.alloc(1024)

  b.write('6c0000000800000000000000240000803800008038000080380000803800008050000000460100003800008050000000d4020000500000004b020000300000802400008050000080500000805000000093030000000000800000008000000080000000800000008000000000','hex')
  var v = 838
  
  var a = [326, 587, 724, 838, 915]
  console.log(ll.all(b))
  console.log(ll.dump(b))
  ll.insert(b, 8, v)
  t.deepEqual(ll.all(b), a)
  t.end()
})

tape('random items', function (t) {

  for(var j = 0; j < 100; j++) {
    var b = Buffer.alloc(10*1024)
    var c = ll.item(b, 0, [0, 0, 0, 0, 0, 0])
    var a = []
    for(var i = 0; i < 50; i++) {
      var d = ll.dump(b)
      var s = b.toString('hex', 0, b.readUInt32LE(0))
      var v = ~~(1000*Math.random())
      a.push(v)
      ll.insert(b, c, v)
      try {
        deepEqual(ll.all(b), a.slice().sort(function (a, b) { return a - b }))
        t.deepEqual(ll.all(b), a.slice().sort(function (a, b) { return a - b }))
        a.forEach(function (v) {
          //searching for an exact value always returns the pointer to that value.
          var p = ll.find(b, c, v).pop()
          t.equal(b.readUInt32LE(p), v)
        })
      }
      catch (err) {
        console.log("PRE", d)
        console.log("POST", ll.dump(b))
        console.log(ll.all(b))
        console.log(s, v)
        throw err
      }
    }
  }

  t.end()
})




