

var tape = require('tape')

var ary = []

function get (i, cb) {
  console.log("GET_", i, ary[i])
  cb(null, ary[i])
}

function BtoS (b, l) {
  var a = []
  for(var i = 0; i < l; i++)
    a.push(b.readUInt32LE(i*4))

  return '[UInt32LE '+a.join(' ') + ']'
}

var buffer = new Buffer(100)
buffer.fill(0)
var list = require('../')(buffer, get)

function insert (value) {
  list.insert(value, ary.push(value)-1, function () {})
}

function B () {
  var args = [].slice.call(arguments)
  var b = Buffer.allocUnsafe(args.length*4)
  for(var i = 0; i < args.length; i++)
    b.writeUInt32LE(args[i], i*4)
  return b
}

tape('simple', function (t) {

  t.deepEqual(list.all(), [])

  insert(10)
  console.log(BtoS(buffer, 0))
  list.find(10, function (err, value, next, prev) {
    t.equal(prev, 8, 'prev')
  })

  t.deepEqual(list.all(), [10])

  insert(20)
  list.find(20, function (err, value, _, prev) {
    t.equal(prev, 16)
  })

  t.deepEqual(list.all(), [10, 20])

  insert(30)

  list.find(30, function (err, value, _, prev) {
    t.equal(prev, 24)
  })

  t.deepEqual(list.all(), [10, 20, 30])

  t.end()
})

