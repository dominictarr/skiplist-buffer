
var ll = require('../level-list')

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

  console.log("DUMP", ll.dump(b))

  ;[21, 1, 17, 29].forEach(function (target) {
    var a = ll.find(b, f, target)
    console.log('find:', target, a)
    var ptr = a.pop()
    t.ok(ll.get(b, ptr) <= target, 'found smaller or equal to target')
    t.ok(ll.get(b, ll.next(b, ptr, 0)) > target, 'next is greater than target')
  })

  console.log('find', 21, ll.find(b, f, 21))
  console.log(ll.find(b, f, 1))
  console.log(ll.find(b, f, 17))
  console.log(ll.find(b, f, 29))

  return t.end()
  console.log(ll.all(b))
  
//  ll.insert(b, f, 21)
//  ll.insert(b, f, 1)
  ll.insert(b, f, 29)
  console.log(ll.dump(b))
  console.log(ll.all(b))
  ll.insert(b, f, 31)
  console.log(ll.dump(b))
  console.log(ll.all(b))
  t.end()
})





